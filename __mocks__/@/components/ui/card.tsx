export const Card = ({ children }: any) => (
  <div data-testid="card">{children}</div>
)

export const CardHeader = ({ children, className }: any) => (
  <div data-testid="card-header" className={className}>{children}</div>
)

export const CardTitle = ({ children, className }: any) => (
  <div data-testid="card-title" className={className}>{children}</div>
)

export const CardContent = ({ children }: any) => (
  <div data-testid="card-content">{children}</div>
)
