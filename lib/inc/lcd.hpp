#pragma once

#include <cstdint>

#include "hardware.hpp"


/*--------------TODO: Update pins with correct numbers------------------------*/
// #define TFT_CS_Pin GPIO_PIN_0
// #define TFT_CS_GPIO_Port GPIOD
#define TFT_RST_Pin GPIO_PIN_7
#define TFT_RST_GPIO_Port GPIOD
#define TFT_DC_Pin GPIO_PIN_6
#define TFT_DC_GPIO_Port GPIOD

/*---------------Various other control signals---------------------*/
#define ILI9488_SLPOUT 0x11
#define ILI9488_DISPON 0x29
#define ILI9488_CASET 0x2A
#define ILI9488_PASET 0x2B
#define ILI9488_RAMWR 0x2C

/*------------------LCD Screen pixel dimensions--------------------*/
#define ILI9488_TFTWIDTH  320
#define ILI9488_TFTHEIGHT 480
#define ILI9488_PIXEL_COUNT	ILI9488_TFTWIDTH * ILI9488_TFTHEIGHT

/*----------------------Color Definitions--------------------------*/
#define WHITE 0xFFFF
#define BLACK 0x0000
#define RED   0xF800
#define YELLOW 0xFFE0
#define GREEN 0x07E0

/**
 * 3 bits for 8 different colors
 */
struct color_t {
    unsigned int r : 1;
    unsigned int g : 1;
    unsigned int b : 1;
};

/**
 * Coordinates of pixels on LCD array
 */
struct pixel_location_t {
    uint16_t x;
    uint16_t y;
};

/**
 * Interface for the ILI9486 LCD controller
 */
class LCD {
public:
    LCD(SPI const &spi, Pin const &reg_sel, Pin const &reset)
        : m_spi(spi), m_reg_sel(reg_sel), m_reset(reset) {}

    auto init() const -> void;

    /**
     * @brief Draws a single pixel
     * @param pos position of pixel
     * @param color pixel color
     */
    auto draw_pixel(pixel_location_t pos, color_t color) const -> void;

    /**
     * @brief Fills the entire screen with a color
     * @param color fill color of screen
     */
    auto fill_screen(/*color_t color*/ uint16_t color) const -> void; // TODO: Consider changing this back to color_t

    /**
     * @brief Clears the screen to be all white
     */
    auto clear_screen() const -> void;

    /**
     * @brief Draws a vertical line
     * @param pos starting position of line (top)
     * @param h height of the line in pixels
     * @param color fill color of rectangle
     */
    auto draw_vertical_line(pixel_location_t pos, uint16_t h, uint16_t color) const -> void;

    /**
     * @brief Draws a horizontal line
     * @param pos starting position of line (left)
     * @param w width of the line in pixels
     * @param color fill color of rectangle
     */
    auto draw_horizontal_line(pixel_location_t pos, uint16_t w, uint16_t color) const -> void;

    /**
     * @brief Draws a filled color rectangle
     * @param pos top left position of rectangle
     * @param w horizontal width of rectangle in pixels
     * @param h vertical height of rectangle in pixels
     * @param color fill color of rectangle
     */
    auto draw_rectangle(pixel_location_t pos, uint16_t w, uint16_t h, uint16_t color) const -> void;

    /*------------BACKDOOR FUNCTIONS---------------*/
    auto send_command(uint8_t command) const -> void;
    auto send_data(uint8_t data) const -> void;
    auto send_data_long(uint8_t const *data, std::size_t size) const -> void;
    auto set_addr_window(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1) const -> void;

    auto start_reset() const -> void;
    auto end_reset() const -> void;
    auto set_command() const -> void;
    auto set_data() const -> void;

private:
    SPI m_spi{};
    Pin m_reg_sel{}; // LCD register select (command/data)
    Pin m_reset{};   // LCD reset
    const uint16_t width = ILI9488_TFTWIDTH;  // width in pixels of LCD screen
    const uint16_t height = ILI9488_TFTHEIGHT; // height in pixels of LCD screen
};
