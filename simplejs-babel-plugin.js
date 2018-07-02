module.exports = function({ types: t }) {

  const typeCheck = (identifier, type, prevIdentifier) => {
    if (type === 'same') {
      if (prevIdentifier == null) {
        return null;
      } else {
        return t.binaryExpression(
          '!==',
          t.unaryExpression('typeof', identifier),
          t.unaryExpression('typeof', prevIdentifier)
        );
      }
    } else if (type === 'null') {
      return t.binaryExpression(
        '!=',
        identifier,
        t.nullLiteral()
      );
    } else {
      return t.binaryExpression(
        '!==',
        t.unaryExpression('typeof', identifier),
        t.stringLiteral(type)
      );
    }
  };

  const wrongSingleTypeCondition = (identifiers, type, onlyRequireOne) => {
    let condition = null;
    let prevId = null;
    for (id of identifiers) {
      const newAssertion = typeCheck(id, type, prevId);

      if (condition == null) {
        condition = newAssertion;
      } else {
        condition = t.logicalExpression(
          onlyRequireOne ? '&&' : '||',
          condition,
          newAssertion
        );
      }

      prevId = id;
    }
    return condition;
  };

  const wrongTypeCondition = (identifiers, type) => {
    if (type === 'plusable') {
      return t.LogicalExpression(
        '&&',
        wrongSingleTypeCondition(identifiers, 'number', false),
        wrongSingleTypeCondition(identifiers, 'string', true)
      );
    } else if (type === 'comparable') {
      return t.LogicalExpression(
        '&&',
        wrongSingleTypeCondition(identifiers, 'same', false),
        wrongSingleTypeCondition(identifiers, 'null', true)
      );
    } else if (type === 'number|string') {
      return t.LogicalExpression(
        '&&',
        wrongSingleTypeCondition(identifiers, 'number', false),
        wrongSingleTypeCondition(identifiers, 'string', false)
      );
    } else {
      return wrongSingleTypeCondition(identifiers, type, false)
    }
  }

  const genIife = (paramIdentifiers, paramValues, resultNode, errorCondition, message) => {
    // look up all identifiers used in the param values so that we can
    // reference them inside the function, and thus have access to them
    // inside the chrome debugger :/
    const paramState = { identifiers: [] };
    paramValues.forEach(p => {
      if (t.isIdentifier(p.node)) {
        // p.traverse doesn't check the `p` node itself, so we do both here:
        visitOneIdentifierNode.call(paramState, p);
      }
      p.traverse(getIdentifiersVisitor, paramState)
    });
    const usedIdentifiers = paramState.identifiers.map(id => t.clone(id));

    return t.callExpression(
      t.functionExpression(
        null, // name
        paramIdentifiers,
        t.blockStatement([
          t.ifStatement(
            errorCondition,
            t.blockStatement([
              t.throwStatement(
                t.newExpression(t.identifier("TypeError"), [
                  t.stringLiteral(message)
                ])
              ),
              // Generate a useless statement containing the parameter expressions
              // so that all those variables are accessible in the debugger inside
              // the iife :/
              t.returnStatement(t.arrayExpression(usedIdentifiers))
            ])
          ),
          t.returnStatement(resultNode)
        ])
      ),
      paramValues.map(p => p.node)
    );
  };

  const checkedTypeOfOperands = (path, operands, type, message) => {
    const node = path.node;
    const names = operands.map(op => '_' + op + '_');

    if (t.isStatement(node)) {
      const outerStatement = t.clone(node);
      operands.forEach((op, i) => {
        const name = names[i];
        outerStatement[op] = genIife(
          [t.identifier(name)],
          [path.get(op)],
          t.identifier(name),
          t.binaryExpression(
            '!==',
            t.unaryExpression('typeof', t.identifier(name)),
            t.stringLiteral(type)
          ),
          message
        );
      });

      return outerStatement;

    } else { // expression

      const innerOp = t.clone(node);
      operands.forEach((op, i) => innerOp[op] = t.identifier(names[i]));

      return genIife(
        names.map(name => t.identifier(name)),
        operands.map(op => path.get(op)),
        innerOp,
        wrongTypeCondition(names.map(name => t.identifier(name)), type),
        message
      );
    }
  };


  const _intentedOperatorSuggestion = {
    '|': '||',
    '&': '&&',
    '^': '**',
    '~': '!',
  };

  const illegalOperandException = (operator) => {
    const intendedOpSuggestion = _intentedOperatorSuggestion[operator];
    return t.callExpression(
      t.functionExpression(
        null, // name
        [], // args
        t.blockStatement([
          t.throwStatement(
            t.newExpression(t.identifier("SyntaxError"), [
              t.stringLiteral(
                'The ' + operator + ' operator not supported in this mode' +
                (intendedOpSuggestion ? '; maybe you meant ' + intendedOpSuggestion : '')
              )
            ])
          )
        ])
      ),
      [] // parameter values
    );
  }


  const getPrintableType = (type, isPlural) => {
    if (type === 'boolean') {
      return isPlural ?
        'booleans (true or false)' :
        'a boolean (true or false)';
    } else if (type === 'null' || type === 'undefined') {
      return 'undefined (or null)';
    } else if (type === 'plusable') {
      return isPlural ? 'numbers or strings' : 'a number or string';
    } else if (type === 'comparable') {
      return 'the same type or undefined';
    } else if (type === 'same') {
      return 'the same type';
    } else if (type === 'number|string') {
      return isPlural ? 'either numbers or strings' : 'a number or string';
    }
    return isPlural ? type + 's' : 'a ' + type;
  }

  const visitOneIdentifierNode = function(path) {
    if (t.isReferenced(path.node, path.parent)) {
      if (path.node.name === 'x') { debugger; }
      this.identifiers.push(path.node);
    }
  };
  const getIdentifiersVisitor = {
    Identifier: visitOneIdentifierNode,
  };

  const visitor = {
    Program(path, state) {
      console.log('PROGRAM', JSON.stringify(state.file.ast, null, 4));
    },

    IfStatement: {
      exit(path, state) {
        path.replaceWith(
          checkedTypeOfOperands(path, ['test'], 'boolean', 'If condition should be a boolean')
        );
        path.skip();
      }
    },

    WhileStatement: {
      exit(path, state) {
        path.replaceWith(
          checkedTypeOfOperands(path, ['test'], 'boolean', 'While loop condition should be a boolean')
        );
        path.skip();
      }
    },

    LogicalExpression: {
      exit(path, state) {
        if (path.node.operator !== '&&' && path.node.operator !== '||') {
          return;
        }

        path.replaceWith(
          checkedTypeOfOperands(
            path,
            ['left', 'right'],
            'boolean',
            'Both sides of ' + path.node.operator + ' should be booleans (true or false). '
          )
        );
        // since this is on exit, we don't have to traverse this again
        // this also avoids infinitely recursing on the new logicalExpression
        path.skip();
      }
    },

    BinaryExpression: {
      exit(path, state) {
        const op = path.node.operator;

        let type = null;

        if (op === '+') {
          type = 'plusable';
        } else if (op === '==' || op === '!=') {
          type = 'comparable';
        } else if (['&', '|', '^', '<<', '>>', '>>>'].indexOf(op) !== -1) {
          type = 'illegal';
        } else if (t.NUMBER_BINARY_OPERATORS.indexOf(op) !== -1) {
          type = 'number';
        } else if (t.BOOLEAN_NUMBER_BINARY_OPERATORS.indexOf(op) !== -1) {
          type = 'number|string';
        }

        if (type === 'illegal') {
          path.replaceWith(illegalOperandException(op));
          path.skip();
          return;
        }

        if (type) {
          path.replaceWith(
            checkedTypeOfOperands(
              path,
              ['left', 'right'],
              type,
              'Both sides of ' + op + ' should be ' + getPrintableType(type, true) + '.'
            )
          );
          path.skip();
        }
      }
    },
  };

  return {
    visitor: visitor,
  };
};

