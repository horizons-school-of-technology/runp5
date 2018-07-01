module.exports = function({ types: t, generator: g }) {
  return {
    visitor: {
      Program(path, state) {
        console.log('PROGRAM', JSON.stringify(state.file.ast, null, 4));
      },

      LogicalExpression: {
        exit(path, state) {
          console.warn('LOGICAL EXP');
          if (path.node.operator === '&&') {
            const lhs = path.node.left;
            const rhs = path.node.right;

            path.replaceWith(
              t.callExpression(
                t.functionExpression(
                  null, // name
                  [t.identifier('left'), t.identifier('right')], // params
                  t.blockStatement([
                    t.ifStatement(
                      t.logicalExpression(
                        '||',
                        t.binaryExpression(
                          '!==',
                          t.unaryExpression("typeof", t.identifier('left')),
                          t.stringLiteral('boolean')
                        ),
                        t.binaryExpression(
                          '!==',
                          t.unaryExpression("typeof", t.identifier('right')),
                          t.stringLiteral('boolean')
                        )
                      ),
                      t.throwStatement(
                        t.stringLiteral('Both sides of && must be booleans (true or false)')
                      )
                    ),
                    t.returnStatement(
                      t.logicalExpression(
                        path.node.operator,
                        t.identifier('left'),
                        t.identifier('right')
                      )
                    )
                  ])
                ),
                [lhs, rhs]
              )
            );
            // since this is on exit, we don't have to traverse this again
            // this also avoids infinitely recursing on the new logicalExpression
            path.skip();
          }
        }
      },
    }
  };
};

