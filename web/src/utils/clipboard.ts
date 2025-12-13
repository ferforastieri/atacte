

export interface CopyResult {
  success: boolean
  message: string
}


export async function copyToClipboard(text: string): Promise<CopyResult> {
  try {
    
    if (navigator.clipboard && window.isSecureContext) {
      
      await navigator.clipboard.writeText(text)
      return {
        success: true,
        message: 'Copiado!'
      }
    } else {
      
      return await fallbackCopyToClipboard(text)
    }
  } catch (error) {
    console.error('Erro ao copiar:', error)
    return {
      success: false,
      message: 'Erro ao copiar. Tente selecionar e copiar manualmente.'
    }
  }
}


async function fallbackCopyToClipboard(text: string): Promise<CopyResult> {
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.setAttribute('readonly', '')
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, 99999) 
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (successful) {
      return {
        success: true,
        message: 'Copiado!'
      }
    } else {
      throw new Error('Falha ao copiar usando fallback')
    }
  } catch (error) {
    console.error('Erro no fallback de cópia:', error)
    return {
      success: false,
      message: 'Erro ao copiar. Tente selecionar e copiar manualmente.'
    }
  }
}


export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext)
}


export function isFallbackCopySupported(): boolean {
  return !!(document.queryCommandSupported && document.queryCommandSupported('copy'))
}
