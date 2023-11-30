export function cls(...classNames: (string | boolean | null | undefined)[]) {
    return classNames.filter(Boolean).join(" ");
}