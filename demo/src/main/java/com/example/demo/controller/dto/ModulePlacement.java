package com.example.demo.controller.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * 모듈 배치 정보 DTO
 */
public class ModulePlacement {

    @NotNull(message = "모듈 ID는 필수입니다")
    @Min(value = 1, message = "모듈 ID는 1 이상이어야 합니다")
    private Long moduleId;

    @NotNull(message = "모듈 위치는 필수입니다")
    private Position position;

    @NotNull(message = "모듈 크기는 필수입니다")
    private Size size;

    private Rotation rotation = new Rotation(); // 기본값 0도 회전

    // 중첩 클래스: 크기 정보
    public static class Size {
        @NotNull(message = "너비는 필수입니다")
        @DecimalMin(value = "0.1", message = "너비는 0.1 이상이어야 합니다")
        private BigDecimal width;

        @NotNull(message = "높이는 필수입니다")
        @DecimalMin(value = "0.1", message = "높이는 0.1 이상이어야 합니다")
        private BigDecimal height;

        @NotNull(message = "깊이는 필수입니다")
        @DecimalMin(value = "0.1", message = "깊이는 0.1 이상이어야 합니다")
        private BigDecimal depth;

        // 기본 생성자
        public Size() {
        }

        // 편의 생성자
        public Size(BigDecimal width, BigDecimal height, BigDecimal depth) {
            this.width = width;
            this.height = height;
            this.depth = depth;
        }

        // Getter/Setter 메서드들
        public BigDecimal getWidth() {
            return width;
        }

        public void setWidth(BigDecimal width) {
            this.width = width;
        }

        public BigDecimal getHeight() {
            return height;
        }

        public void setHeight(BigDecimal height) {
            this.height = height;
        }

        public BigDecimal getDepth() {
            return depth;
        }

        public void setDepth(BigDecimal depth) {
            this.depth = depth;
        }

        // Double 값 반환 메서드들
        public double getWidthAsDouble() {
            return width != null ? width.doubleValue() : 0.0;
        }

        public double getHeightAsDouble() {
            return height != null ? height.doubleValue() : 0.0;
        }

        public double getDepthAsDouble() {
            return depth != null ? depth.doubleValue() : 0.0;
        }

        // 부피 계산
        public double getVolumeAsDouble() {
            return getWidthAsDouble() * getHeightAsDouble() * getDepthAsDouble();
        }

        @Override
        public String toString() {
            return String.format("Size{width=%s, height=%s, depth=%s}", width, height, depth);
        }
    }

    // 중첩 클래스: 위치 정보
    public static class Position {
        @NotNull(message = "X 좌표는 필수입니다")
        @DecimalMin(value = "0.0", message = "X 좌표는 0.0 이상이어야 합니다")
        private BigDecimal x;

        @NotNull(message = "Y 좌표는 필수입니다")
        @DecimalMin(value = "0.0", message = "Y 좌표는 0.0 이상이어야 합니다")
        private BigDecimal y;

        @NotNull(message = "Z 좌표는 필수입니다")
        @DecimalMin(value = "0.0", message = "Z 좌표는 0.0 이상이어야 합니다")
        private BigDecimal z;

        // 기본 생성자
        public Position() {
        }

        // 편의 생성자
        public Position(BigDecimal x, BigDecimal y, BigDecimal z) {
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

        @Override
        public String toString() {
            return String.format("Position{x=%s, y=%s, z=%s}", x, y, z);
        }
    }

    // 기본 생성자
    public ModulePlacement() {
    }

    // 편의 생성자
    public ModulePlacement(Long moduleId, Position position, Size size) {
        this.moduleId = moduleId;
        this.position = position;
        this.size = size;
    }

    // Getter/Setter 메서드들
    public Long getModuleId() {
        return moduleId;
    }

    public void setModuleId(Long moduleId) {
        this.moduleId = moduleId;
    }

    public Position getPosition() {
        return position;
    }

    public void setPosition(Position position) {
        this.position = position;
    }

    public Size getSize() {
        return size;
    }

    public void setSize(Size size) {
        this.size = size;
    }

    public Rotation getRotation() {
        return rotation;
    }

    public void setRotation(Rotation rotation) {
        this.rotation = rotation;
    }

    // 헬퍼 메서드들
    public double getXAsDouble() {
        return position != null && position.getX() != null ? position.getX().doubleValue() : 0.0;
    }

    public double getYAsDouble() {
        return position != null && position.getY() != null ? position.getY().doubleValue() : 0.0;
    }

    public double getZAsDouble() {
        return position != null && position.getZ() != null ? position.getZ().doubleValue() : 0.0;
    }

    @Override
    public String toString() {
        return String.format("ModulePlacement{moduleId=%d, position=%s, rotation=%s}",
                moduleId, position, rotation);
    }

    // 중첩 클래스: 회전 정보
    public static class Rotation {
        private double x = 0.0; // X축 회전 (도)
        private double y = 0.0; // Y축 회전 (도)
        private double z = 0.0; // Z축 회전 (도)

        // 기본 생성자
        public Rotation() {
        }

        // 편의 생성자
        public Rotation(double x, double y, double z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }

        // Getters and Setters
        public double getX() {
            return x;
        }

        public void setX(double x) {
            this.x = x;
        }

        public double getY() {
            return y;
        }

        public void setY(double y) {
            this.y = y;
        }

        public double getZ() {
            return z;
        }

        public void setZ(double z) {
            this.z = z;
        }

        @Override
        public String toString() {
            return String.format("Rotation{x=%.1f, y=%.1f, z=%.1f}", x, y, z);
        }
    }
}
