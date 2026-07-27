import { useEffect, useRef } from 'react'

type ConfirmDialogProps = {
    open: boolean
    title: string
    description: string
    confirmLabel: string
    isPending?: boolean
    onCancel: () => void
    onConfirm: () => void
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    isPending = false,
    onCancel,
    onConfirm,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current

        if (!dialog) {
            return
        }

        if (open && !dialog.open) {
            dialog.showModal()
        }

        if (!open && dialog.open) {
            dialog.close()
        }
    }, [open])

    return (
        <dialog
            className="confirm-dialog"
            ref={dialogRef}
            onCancel={(event) => {
                event.preventDefault()

                if (!isPending) {
                    onCancel()
                }
            }}
            onClick={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isPending
                ) {
                    onCancel()
                }
            }}
        >
            <div className="confirm-dialog__icon" aria-hidden="true">
                !
            </div>

            <div className="confirm-dialog__copy">
                <p className="panel-kicker">Confirm action</p>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>

            <div className="confirm-dialog__actions">
                <button
                    className="button button--secondary"
                    type="button"
                    onClick={onCancel}
                    disabled={isPending}
                >
                    Cancel
                </button>
                <button
                    className="button button--danger-solid"
                    type="button"
                    onClick={onConfirm}
                    disabled={isPending}
                >
                    {isPending ? 'Deleting...' : confirmLabel}
                </button>
            </div>
        </dialog>
    )
}
