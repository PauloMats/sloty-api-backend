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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const public_decorator_1 = require("../common/decorators/public.decorator");
const availability_dto_1 = require("./dto/availability.dto");
const availability_service_1 = require("./availability.service");
let AvailabilityController = class AvailabilityController {
    availabilityService;
    constructor(availabilityService) {
        this.availabilityService = availabilityService;
    }
    setWeeklyAvailability(user, businessId, dto) {
        return this.availabilityService.setWeeklyAvailability(user, businessId, dto);
    }
    getWeeklyAvailability(businessId) {
        return this.availabilityService.getWeeklyAvailability(businessId);
    }
    createClosure(user, businessId, dto) {
        return this.availabilityService.createClosure(user, businessId, dto);
    }
    listClosures(businessId) {
        return this.availabilityService.listClosures(businessId);
    }
    deleteClosure(user, businessId, closureId) {
        return this.availabilityService.deleteClosure(user, businessId, closureId);
    }
    getSlots(businessId, serviceId, query) {
        return this.availabilityService.getAvailableSlots(businessId, serviceId, query);
    }
    getSlotsInRange(businessId, serviceId, query) {
        return this.availabilityService.getAvailableRange(businessId, serviceId, query);
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, common_1.Put)('businesses/:businessId/availability/weekly'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, availability_dto_1.SetWeeklyAvailabilityDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "setWeeklyAvailability", null);
__decorate([
    (0, common_1.Get)('businesses/:businessId/availability/weekly'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getWeeklyAvailability", null);
__decorate([
    (0, common_1.Post)('businesses/:businessId/closures'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, availability_dto_1.CreateBusinessClosureDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "createClosure", null);
__decorate([
    (0, common_1.Get)('businesses/:businessId/closures'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Param)('businessId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "listClosures", null);
__decorate([
    (0, common_1.Delete)('businesses/:businessId/closures/:closureId'),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('businessId')),
    __param(2, (0, common_1.Param)('closureId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "deleteClosure", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('availability/businesses/:businessId/services/:serviceId/slots'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, availability_dto_1.AvailabilitySlotsQueryDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getSlots", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('availability/businesses/:businessId/services/:serviceId/range'),
    __param(0, (0, common_1.Param)('businessId')),
    __param(1, (0, common_1.Param)('serviceId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, availability_dto_1.AvailabilityRangeQueryDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getSlotsInRange", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('Availability'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map