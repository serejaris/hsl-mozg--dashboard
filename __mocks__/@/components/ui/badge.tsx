export const Badge = ({ children, variant, className }: any) => (
  <span data-testid="badge" data-variant={variant} className={className}>
    {children}
  </span>
)
