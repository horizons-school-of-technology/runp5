module.exports = function({ types: t }) {

  const typeCheck = (identifier, type) => {
    if (type === 'number|string') {
      return t.logicalExpression(
        '&&',
        t.binaryExpression('!==', t.unaryExpression('typeof', identifier), t.stringLiteral('number')),
        t.binaryExpression('!==', t.unaryExpression('typeof', identifier), t.stringLiteral('string'))
      );
    } else {
      return t.binaryExpression(
        '!==',
        t.unaryExpression('typeof', identifier),
        t.stringLiteral(type)
      );
    }
  };

  const wrongTypeCondition = (identifiers, type) => {
    let condition = null;
    for (id of identifiers) {
      const newAssertion = typeCheck(id, type);
      if (condition == null) {
        condition = newAssertion;
      } else {
        condition = t.logicalExpression(
          '||',
          condition,
          newAssertion
        );
      }
    }
    return condition;
  };


  const genIife = (paramIdentifiers, paramValues, resultNode, errorCondition, message) => {
    return t.callExpression(
      t.functionExpression(
        null, // name
        paramIdentifiers,
        t.blockStatement([
          t.ifStatement(
            errorCondition,
            t.throwStatement(
              t.newExpression(t.identifier("TypeError"), [
                t.stringLiteral(message)
              ])
            )
          ),
          t.returnStatement(resultNode)
        ])
      ),
      paramValues
    );
  };

  const checkedTypeOfOperands = (node, operands, type, message) => {
    const names = operands.map(op => '_' + op + '_');

    if (t.isStatement(node)) {
      const outerStatement = t.clone(node);
      operands.forEach((op, i) => {
        const name = names[i];
        outerStatement[op] = genIife(
          [t.identifier(name)],
          [node[op]],
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
        operands.map(op => node[op]),
        innerOp,
        wrongTypeCondition(names.map(name => t.identifier(name)), type),
        message
      );
    }

  };

  const getPrintableType = (type, isPlural) => {
    if (type === 'boolean') {
      return isPlural ?
        'booleans (true or false)' :
        'a boolean (true or false)';
    } else if (type === 'null' || type === 'undefined') {
      return 'undefined (or null)';
    } else if (type === 'number|string') {
      return 'a number or string';
    } else if (type === 'same') {
      return 'the same type';
    }
    return isPlural ? type + 's' : 'a ' + type;
  }

  const visitor = {
    Program(path, state) {
      console.log('PROGRAM', JSON.stringify(state.file.ast, null, 4));
    },

    IfStatement: {
      exit(path, state) {
        path.replaceWith(
          checkedTypeOfOperands(path.node, ['test'], 'boolean', 'If condition should be a boolean')
        );
        path.skip();
      }
    },

    WhileStatement: {
      exit(path, state) {
        path.replaceWith(
          checkedTypeOfOperands(path.node, ['test'], 'boolean', 'While loop condition should be a boolean')
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
            path.node,
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
          type = 'number|string';
        } else if (op === '==' || op === '!=') {

        } else if (t.NUMBER_BINARY_OPERATORS.indexOf(op) !== -1) {
          type = 'number';
        } else if (t.BOOLEAN_NUMBER_BINARY_OPERATORS.indexOf(op) !== -1) {
          type = 'number|string';
        }

        if (type) {
          path.replaceWith(
            checkedTypeOfOperands(
              path.node,
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

