export interface ProtoGuidedAnswers {
  productType: string;
  authModel: string;
  dataLayer: string;
  deploymentTarget: string;
}

export function isProtoGuidedFlowComplete(value: ProtoGuidedAnswers): boolean {
  return Boolean(value.productType && value.authModel && value.dataLayer && value.deploymentTarget);
}
