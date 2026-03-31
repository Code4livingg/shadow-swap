type Toast = {
  description: string
  id: string
  title: string
  tone: 'error' | 'info' | 'success'
}

type ToastStackProps = {
  toasts: Toast[]
}

export function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <article className={`toast-card ${toast.tone}`} key={toast.id}>
          <strong>{toast.title}</strong>
          <p>{toast.description}</p>
        </article>
      ))}
    </div>
  )
}
