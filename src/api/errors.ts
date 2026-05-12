/**
 * Typed API error class for consistent error handling across the application.
 */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Error codes and their default messages, as defined in the design document.
 */
export const ERROR_MESSAGES = {
  // Validation
  'VALIDATION.EMPTY_NAME': 'O nome não pode estar vazio',
  'VALIDATION.NAME_TOO_LONG': 'O nome deve ter no máximo 255 caracteres',
  'VALIDATION.INVALID_EMAIL': 'Formato de email inválido',
  'VALIDATION.PASSWORD_TOO_SHORT': 'A senha deve ter no mínimo 8 caracteres',

  // Authentication
  'AUTH.INVALID_CREDENTIALS': 'Email ou senha incorretos',
  'AUTH.EMAIL_IN_USE': 'Este email já está cadastrado',
  'AUTH.SESSION_EXPIRED': 'Sua sessão expirou. Faça login novamente.',
  'AUTH.ACCESS_DENIED': 'Você não tem permissão para acessar este recurso',
  'AUTH.NO_TOKEN': 'Token de autenticação não fornecido',
  'AUTH.INVALID_TOKEN': 'Token de autenticação inválido',

  // Resources
  'RESOURCE.NOT_FOUND': 'O recurso solicitado não foi encontrado',
  'RESOURCE.FOLDER_DEPTH_EXCEEDED': 'Limite de 5 níveis de pastas excedido',
  'RESOURCE.CIRCULAR_REFERENCE':
    'Não é possível mover uma pasta para dentro de si mesma',

  'VALIDATION.INVALID_CANVAS_DATA':
    'O canvasData deve ser um objeto JSON válido',

  // System
  'SYSTEM.SAVE_FAILED':
    'Falha ao salvar. Suas alterações estão salvas localmente.',
  'SYSTEM.CONNECTION_ERROR': 'Erro de conexão. Verifique sua internet.',
} as const

export type ErrorCode = keyof typeof ERROR_MESSAGES
