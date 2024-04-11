import type { NodePath, types as t } from '@babel/core';

export function name(value: t.Identifier | t.StringLiteral): string {
  if (value.type === 'Identifier') {
    return value.name;
  } else {
    return value.value;
  } 
}

export type CallIdentifierExpression = t.CallExpression & { callee: t.Identifier };

export function isCallIdentifierExpression(exp: t.CallExpression): exp is CallIdentifierExpression {
  return exp.callee.type === 'Identifier';
}

export type CallStatementPath = NodePath<
  t.ExpressionStatement & { expression: CallIdentifierExpression }
>;
export function isCallStatementPath(
  path: NodePath<t.ExpressionStatement>
): path is CallStatementPath {
  return (
    path.node.expression.type === 'CallExpression' &&
    isCallIdentifierExpression(path.node.expression)
  );
}
