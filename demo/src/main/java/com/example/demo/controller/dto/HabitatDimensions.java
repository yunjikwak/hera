package com.example.demo.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * 거주지 크기 정보 DTO
 */
public class HabitatDimensions {

    @NotNull(message = "X축 크기는 필수입니다")
    @DecimalMin(value = "1.0", message = "X축은 최소 1.0m 이상이어야 합니다")
    private BigDecimal x;

    @NotNull(message = "Y축 크기는 필수입니다")
    @DecimalMin(value = "1.0", message = "Y축은 최소 1.0m 이상이어야 합니다")
    private BigDecimal y;

    @NotNull(message = "Z축 크기는 필수입니다")
    @DecimalMin(value = "1.0", message = "Z축은 최소 1.0m 이상이어야 합니다")
    private BigDecimal z;

    // 기본 생성자
    public HabitatDimensions() {
    }

    // 편의 생성자
    public HabitatDimensions(BigDecimal x, BigDecimal y, BigDecimal z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Getter/Setter 메서드들
    public BigDecimal getX() {
        return x;
    }

    public void setX(BigDecimal x) {
        this.x = x;
    }

    public BigDecimal getY() {
        return y;
    }

    public void setY(BigDecimal y) {
        this.y = y;
    }

    public BigDecimal getZ() {
        return z;
    }

    public void setZ(BigDecimal z) {
        this.z = z;
    }

    // Double 값 반환 메서드들
    public double getXAsDouble() {
        return x != null ? x.doubleValue() : 0.0;
    }

    public double getYAsDouble() {
        return y != null ? y.doubleValue() : 0.0;
    }

    public double getZAsDouble() {
        return z != null ? z.doubleValue() : 0.0;
    }

    public BigDecimal getTotalVolume() {
        if (x == null || y == null || z == null) {
            return BigDecimal.ZERO;
        }
        return x.multiply(y).multiply(z);
    }

    public double getTotalVolumeAsDouble() {
        return getTotalVolume().doubleValue();
    }

    @Override
    public String toString() {
        return String.format("HabitatDimensions{x=%s, y=%s, z=%s, volume=%s}",
                x, y, z, getTotalVolume());
    }
}
