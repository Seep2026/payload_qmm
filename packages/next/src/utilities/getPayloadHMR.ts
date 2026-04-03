import type { InitOptions, Payload } from 'payload'

import { getPayload } from 'payload'

/**
 *  getPayloadHMR is no longer preferred.
 *  You can now use in all contexts:
 *  ```ts
 *   import { getPayload } from 'payload'
 *  ```
 * @deprecated
 */
export const getPayloadHMR = async (
  options: Pick<InitOptions, 'config' | 'importMap'>,
): Promise<Payload> => {
  const result = await getPayload(options)

  if (process.env.PAYLOAD_LOG_DEPRECATED_HMR === 'true') {
    result.logger.warn(
      "Deprecation warning: getPayloadHMR is no longer preferred. You can now use `import { getPayload } from 'payload' in all contexts.",
    )
  }

  return result
}
