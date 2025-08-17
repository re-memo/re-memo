import { toast as sonnerToast } from "sonner"

const toast = ({ ...props }) => {
  return sonnerToast({ ...props })
}

const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  }
}

export { toast, useToast }
