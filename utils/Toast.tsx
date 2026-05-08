import { toast } from "react-toastify";

const ToastBody = ({
    message,
    description,
}: {
    message: string;
    description?: string;
}) => (
    <div>
        <strong>{message}</strong>
        {description && (
            <div style={{ fontSize: "0.9em", marginTop: "4px" }}>
                {description}
            </div>
        )}
    </div>
);

export const toastSuccess = (message: string, description?: string) =>
    toast.success(<ToastBody message={message} description={description} />);

export const toastError = (message: string, description?: string) =>
    toast.error(<ToastBody message={message} description={description} />);

export const toastInfo = (message: string, description?: string) =>
    toast.info(<ToastBody message={message} description={description} />);

export const toastWarning = (message: string, description?: string) =>
    toast.warn(<ToastBody message={message} description={description} />);

export const toastLoading = (message: string, description?: string) =>
    toast.loading(<ToastBody message={message} description={description} />);

export const dismissToast = (id: string | number) => toast.dismiss(id);
