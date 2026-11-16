#include <stdio.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_system.h"
#include "esp_log.h"
#include "driver/gpio.h"

static const char *TAG = "ESP_STUDIO";
#define BLINK_GPIO 48

void app_main(void)
{
    ESP_LOGI(TAG, "ESP-IDF v5.1.2 Booting on ESP32-S3");
    ESP_LOGI(TAG, "Assigned Device ID: SPRAYER-001");

    gpio_reset_pin(BLINK_GPIO);
    gpio_set_direction(BLINK_GPIO, GPIO_MODE_OUTPUT);

    uint32_t count = 0;
    while (1) {
        gpio_set_level(BLINK_GPIO, 1);
        vTaskDelay(pdMS_TO_TICKS(500));
        gpio_set_level(BLINK_GPIO, 0);
        vTaskDelay(pdMS_TO_TICKS(500));

        count++;
        ESP_LOGI(TAG, "FreeRTOS Tick %lu | Free Heap: %lu", count, esp_get_free_heap_size());
    }
}
