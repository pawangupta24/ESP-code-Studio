/**
 * Generates an NVS partition CSV entry for provisioning logical device IDs onto ESP32-S3 boards.
 */
export function generateNvsProvisioningCsv(deviceId: string, firmwareVersion: string): string {
  return `key,type,encoding,value
esp_studio,namespace,,
device_id,data,string,${deviceId}
fw_ver,data,string,${firmwareVersion}
`;
}
