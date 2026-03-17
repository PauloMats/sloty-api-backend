"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCatalogServiceDto = exports.CreateCatalogServiceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCatalogServiceDto {
    name;
    description;
    durationMinutes;
    priceCents;
    currency;
    bufferBeforeMinutes;
    bufferAfterMinutes;
    isActive;
}
exports.CreateCatalogServiceDto = CreateCatalogServiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Corte Masculino' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(140),
    __metadata("design:type", String)
], CreateCatalogServiceDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCatalogServiceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 45 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    __metadata("design:type", Number)
], CreateCatalogServiceDto.prototype, "durationMinutes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4500 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCatalogServiceDto.prototype, "priceCents", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BRL' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCatalogServiceDto.prototype, "currency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCatalogServiceDto.prototype, "bufferBeforeMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCatalogServiceDto.prototype, "bufferAfterMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCatalogServiceDto.prototype, "isActive", void 0);
class UpdateCatalogServiceDto extends (0, swagger_1.PartialType)(CreateCatalogServiceDto) {
}
exports.UpdateCatalogServiceDto = UpdateCatalogServiceDto;
//# sourceMappingURL=service.dto.js.map