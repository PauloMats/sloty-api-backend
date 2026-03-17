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
exports.AvailabilityRangeQueryDto = exports.AvailabilitySlotsQueryDto = exports.CreateBusinessClosureDto = exports.SetWeeklyAvailabilityDto = exports.WeeklyAvailabilityEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class WeeklyAvailabilityEntryDto {
    dayOfWeek;
    startTime;
    endTime;
}
exports.WeeklyAvailabilityEntryDto = WeeklyAvailabilityEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '0 = Sunday, 6 = Saturday' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], WeeklyAvailabilityEntryDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00' }),
    (0, class_validator_1.Matches)(/^\d{2}:\d{2}$/),
    __metadata("design:type", String)
], WeeklyAvailabilityEntryDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '18:00' }),
    (0, class_validator_1.Matches)(/^\d{2}:\d{2}$/),
    __metadata("design:type", String)
], WeeklyAvailabilityEntryDto.prototype, "endTime", void 0);
class SetWeeklyAvailabilityDto {
    entries;
}
exports.SetWeeklyAvailabilityDto = SetWeeklyAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [WeeklyAvailabilityEntryDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WeeklyAvailabilityEntryDto),
    __metadata("design:type", Array)
], SetWeeklyAvailabilityDto.prototype, "entries", void 0);
class CreateBusinessClosureDto {
    startsAt;
    endsAt;
    reason;
}
exports.CreateBusinessClosureDto = CreateBusinessClosureDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-10T12:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBusinessClosureDto.prototype, "startsAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-10T15:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBusinessClosureDto.prototype, "endsAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Holiday maintenance' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBusinessClosureDto.prototype, "reason", void 0);
class AvailabilitySlotsQueryDto {
    date;
}
exports.AvailabilitySlotsQueryDto = AvailabilitySlotsQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-14' }),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], AvailabilitySlotsQueryDto.prototype, "date", void 0);
class AvailabilityRangeQueryDto {
    startDate;
    endDate;
}
exports.AvailabilityRangeQueryDto = AvailabilityRangeQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-14' }),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], AvailabilityRangeQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-20' }),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    __metadata("design:type", String)
], AvailabilityRangeQueryDto.prototype, "endDate", void 0);
//# sourceMappingURL=availability.dto.js.map