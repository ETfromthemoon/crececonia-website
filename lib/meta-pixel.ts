export type MetaEventParameters = Record<string, string | number | string[] | undefined>;

/** Browser Meta is suspended, including when an old/global fbq exists. */
export function trackMetaEvent(_eventName: string, _parameters: MetaEventParameters = {}): void {
  // Preserve callers without forwarding data to an uncontrolled browser SDK.
}
