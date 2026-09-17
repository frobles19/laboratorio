export function friendlyDeleteError(message: string): string {
  if (message.includes("foreign key constraint") || message.includes("violates foreign key")) {
    return "No se puede eliminar: está en uso por otros registros del sistema (equipos, movimientos, comisiones, etc.).";
  }
  return message;
}
