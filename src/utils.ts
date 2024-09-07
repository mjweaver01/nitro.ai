export function convertModel(model) {
  console.log(model)
  if (model?.includes('gpt')) {
    return 'ChatGPT'
  } else if (model?.includes('anthropic')) {
    return 'Claude Sonnet'
  }

  return 'ChatGPT'
}
