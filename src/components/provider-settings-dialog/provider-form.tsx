// Ghost AI by Brendigo
'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'
import { Eye, EyeOff, Loader2, Check, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { LLMProvider, ModelItem } from './types'
import { isCustomProvider } from './types'
import { requiresApiKeyForFetch } from './constants'
import { isPlaintextRemoteEndpoint, isValidProviderEndpoint } from './provider-endpoint'

type CheckStatus = 'idle' | 'checking' | 'success' | 'failed'

interface CheckApiResult {
  success: boolean
  latency_ms: number
  error: string | null
}

/** The model the API check sends "hi" to: the last model in the list. */
function getTestModelId(models: ModelItem[]): string | null {
  return models.length > 0 ? models[models.length - 1].modelId : null
}

interface ProviderFormProps {
  apiKey: string
  onApiKeyChange: (key: string) => void
  showApiKey: boolean
  onShowApiKeyChange: (show: boolean) => void
  apiBaseUrl: string
  onApiBaseUrlChange: (url: string) => void
  selectedProvider: LLMProvider
  providerName: string
  onProviderNameChange: (name: string) => void
  apiStyle: string
  onApiStyleChange: (style: string) => void
  compatibilityType: string
  onCompatibilityTypeChange: (type: string) => void
  models: ModelItem[]
}

export function ProviderForm({
  apiKey,
  onApiKeyChange,
  showApiKey,
  onShowApiKeyChange,
  apiBaseUrl,
  onApiBaseUrlChange,
  selectedProvider,
  providerName,
  onProviderNameChange,
  apiStyle,
  onApiStyleChange,
  compatibilityType,
  onCompatibilityTypeChange,
  models,
}: ProviderFormProps) {
  const { t } = useTranslation('providers')
  const isCustom = isCustomProvider(selectedProvider)
  const isKeylessLocal = ['ollama', 'lmstudio', 'gpustack', 'ovms'].includes(selectedProvider.id)
  const invalidEndpoint = apiBaseUrl.trim().length > 0 && !isValidProviderEndpoint(apiBaseUrl)
  const plaintextRemoteEndpoint = isPlaintextRemoteEndpoint(apiBaseUrl)

  const [checkStatus, setCheckStatus] = React.useState<CheckStatus>('idle')
  const [checkError, setCheckError] = React.useState<string | null>(null)
  const [checkLatency, setCheckLatency] = React.useState<number | null>(null)
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestGenerationRef = React.useRef(0)

  React.useEffect(() => {
    requestGenerationRef.current += 1
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    setCheckStatus('idle')
    setCheckError(null)
    setCheckLatency(null)
  }, [selectedProvider.id, apiKey, apiBaseUrl, compatibilityType, apiStyle, models])

  React.useEffect(() => {
    return () => {
      requestGenerationRef.current += 1
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  const handleCheckApi = React.useCallback(async () => {
    const generation = ++requestGenerationRef.current
    const providerType = isCustom
      ? compatibilityType === 'anthropic'
        ? 'custom_anthropic'
        : 'custom_openai'
      : selectedProvider.id

    const testModelId = getTestModelId(models)
    if (!testModelId) {
      setCheckStatus('failed')
      setCheckError(t('noModelForTesting'))
      return
    }

    setCheckStatus('checking')
    setCheckError(null)
    setCheckLatency(null)

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)

    try {
      const result = await invoke<CheckApiResult>('check_provider_api', {
        providerType,
        modelId: testModelId,
        apiKey: apiKey || null,
        baseUrl: apiBaseUrl || null,
        apiStyle: isCustom && compatibilityType === 'openai' ? apiStyle : null,
      })

      if (generation !== requestGenerationRef.current) return
      if (result.success) {
        setCheckStatus('success')
        setCheckLatency(result.latency_ms)
        resetTimerRef.current = setTimeout(() => {
          if (generation === requestGenerationRef.current) {
            setCheckStatus('idle')
            setCheckLatency(null)
          }
        }, 5000)
      } else {
        setCheckStatus('failed')
        // Never surface provider responses verbatim: URLs, query parameters
        // and unrelated credentials can appear in native transport errors.
        setCheckError(t('connectionFailed'))
      }
    } catch {
      if (generation !== requestGenerationRef.current) return
      setCheckStatus('failed')
      setCheckError(t('connectionFailed'))
    }
  }, [selectedProvider, isCustom, compatibilityType, apiKey, apiBaseUrl, apiStyle, models, t])

  return (
    <div className="min-w-0 space-y-4">
      {isCustom && (
        <>
          <div className="space-y-2">
            <Label htmlFor="provider-name">{t('providerName')} <span aria-hidden="true" className="text-destructive">*</span></Label>
            <Input
              id="provider-name"
              type="text"
              required
              aria-required="true"
              placeholder={t('customProviderPlaceholder')}
              value={providerName}
              onChange={(e) => onProviderNameChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('apiCompatibility')}</Label>
            <RadioGroup
              value={compatibilityType}
              onValueChange={onCompatibilityTypeChange}
              className="flex flex-wrap gap-x-4 gap-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="openai" id="compat-openai" />
                <Label htmlFor="compat-openai" className="font-normal cursor-pointer">
                  {t('openaiCompatible')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="anthropic" id="compat-anthropic" />
                <Label htmlFor="compat-anthropic" className="font-normal cursor-pointer">
                  {t('anthropicCompatible')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {compatibilityType === 'openai' && (
            <div className="space-y-2">
              <Label>{t('apiStyle')}</Label>
              <RadioGroup value={apiStyle} onValueChange={onApiStyleChange} className="flex flex-wrap gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="chat_completions" id="api-style-cc" />
                  <Label htmlFor="api-style-cc" className="font-normal cursor-pointer">
                    {t('chatCompletionsApi')}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="responses" id="api-style-resp" />
                  <Label htmlFor="api-style-resp" className="font-normal cursor-pointer">
                    {t('responsesApi')}
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">{t('apiStyleDescription')}</p>
            </div>
          )}
        </>
      )}

      {isKeylessLocal ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#00E5FF]/25 bg-[#00E5FF]/5 p-3 text-sm">
          <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#00E5FF]" />
          <div>
            <p className="font-medium text-[#E5F9FB]">{t('localNoApiKey')}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#B2C3D8]">{t('localNoApiKeyDescription')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
        <Label htmlFor="api-key">{t('apiKey')}</Label>
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          <div className="relative min-w-[min(100%,240px)] flex-1">
            <Input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              placeholder={t('apiKeyPlaceholder')}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="h-10 rounded-xl border-[#405474] bg-[#0D1726] pr-10"
              disabled={selectedProvider.id === 'ollama'}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              aria-pressed={showApiKey}
              disabled={selectedProvider.id === 'ollama'}
              onClick={() => onShowApiKeyChange(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="size-4 text-muted-foreground" />
              ) : (
                <Eye className="size-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <Button
            type="button"
            variant={
              checkStatus === 'success'
                ? 'default'
                : checkStatus === 'failed'
                  ? 'destructive'
                  : 'outline'
            }
            size="sm"
            className="h-10 max-w-full shrink-0"
            onClick={handleCheckApi}
            disabled={checkStatus === 'checking' || invalidEndpoint || models.length === 0 || (requiresApiKeyForFetch(selectedProvider.id) && !apiKey.trim())}
          >
            {checkStatus === 'checking' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : checkStatus === 'success' ? (
              <>
                <Check className="size-4" />
                {checkLatency != null && <span className="ml-1 text-xs">{checkLatency}ms</span>}
              </>
            ) : checkStatus === 'failed' ? (
              <>
                <AlertTriangle className="size-4" />
                <span className="ml-1">{t('failed')}</span>
              </>
            ) : (
              t('testConnection')
            )}
          </Button>
        </div>
        {checkStatus === 'failed' && checkError && (
          <div role="alert" className="text-xs text-destructive space-y-1">
            <p className="font-medium">{t('connectionFailed')}</p>
            <div className="px-2 py-1.5 bg-destructive/5 rounded max-h-24 overflow-y-auto">
              <p className="font-mono text-destructive/80 whitespace-pre-wrap break-all">
                {checkError}
              </p>
            </div>
          </div>
        )}
        {checkStatus === 'success' && (
          <p className="text-xs text-success">{t('connectionSuccessful')}</p>
        )}
        {checkStatus !== 'failed' && checkStatus !== 'success' && (
          <p className="text-xs text-muted-foreground">{t('yourApiKeyWillBeStored')}</p>
        )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="api-base-url">
          {t('apiBaseUrl')}
          {isCustom && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <Input
          id="api-base-url"
          type="url"
          required={isCustom}
          aria-required={isCustom}
          aria-invalid={invalidEndpoint}
          aria-describedby={invalidEndpoint ? 'api-base-url-error' : undefined}
          placeholder="https://api.example.com/v1"
          value={apiBaseUrl}
          onChange={(e) => onApiBaseUrlChange(e.target.value)}
          className="h-10 rounded-xl border-[#405474] bg-[#0D1726]"
        />
        {invalidEndpoint && (
          <p id="api-base-url-error" role="alert" className="text-xs text-destructive">
            {t('invalidBaseUrl')}
          </p>
        )}
        {plaintextRemoteEndpoint && (
          <p role="status" className="text-xs text-warning">
            {t('unsecuredEndpointWarning')}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {isCustom ? (
            t('apiBaseUrlRequired')
          ) : (
            <>
              {t('apiBaseUrlOptional')}
              {apiBaseUrl !== selectedProvider.baseUrl && (
                <>
                  {' · '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => onApiBaseUrlChange(selectedProvider.baseUrl)}
                  >
                    {t('restoreDefault')}
                  </button>
                </>
              )}
            </>
          )}
        </p>
      </div>
      {isKeylessLocal && (
        <div className="space-y-2 border-t border-[#30415D]/75 pt-4">
          <Button
            type="button"
            variant={checkStatus === 'failed' ? 'destructive' : 'outline'}
            onClick={handleCheckApi}
            disabled={checkStatus === 'checking' || invalidEndpoint || models.length === 0}
            className="border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#B5F5FC] hover:bg-[#00E5FF]/20"
          >
            {checkStatus === 'checking' ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> :
              checkStatus === 'success' ? <Check aria-hidden="true" className="size-4" /> :
              checkStatus === 'failed' ? <AlertTriangle aria-hidden="true" className="size-4" /> : null}
            {checkStatus === 'checking' ? t('common:loading') : t('testConnection')}
            {checkStatus === 'success' && checkLatency != null ? `${checkLatency}ms` : null}
          </Button>
          {models.length === 0 && <p className="text-xs text-[#B2C3D8]">{t('noModelForTesting')}</p>}
          {checkStatus === 'success' && <p role="status" className="text-xs text-success">{t('connectionSuccessful')}</p>}
          {checkStatus === 'failed' && <p role="alert" className="text-xs text-destructive">{checkError || t('connectionFailed')}</p>}
        </div>
      )}

    </div>
  )
}
