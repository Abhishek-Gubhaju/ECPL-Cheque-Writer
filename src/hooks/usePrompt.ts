import { ref, reactive } from 'vue'

interface PromptConfig {
  title: string
  message?: string
  defaultValue?: string
  placeholder?: string
}

const visible = ref(false)
const config = reactive<PromptConfig>({
  title: '',
  message: '',
  defaultValue: '',
  placeholder: '',
})

let resolveFn: ((value: string | null) => void) | null = null

export function usePrompt() {
  function prompt(cfg: PromptConfig): Promise<string | null> {
    return new Promise((resolve) => {
      config.title = cfg.title
      config.message = cfg.message ?? ''
      config.defaultValue = cfg.defaultValue ?? ''
      config.placeholder = cfg.placeholder ?? ''
      visible.value = true
      resolveFn = resolve
    })
  }

  function confirm(value: string | null) {
    visible.value = false
    resolveFn?.(value)
    resolveFn = null
  }

  function cancel() {
    visible.value = false
    resolveFn?.(null)
    resolveFn = null
  }

  return {
    visible,
    config,
    prompt,
    confirm,
    cancel,
  }
}