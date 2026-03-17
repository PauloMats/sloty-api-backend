"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDeterministic = serializeDeterministic;
function serializeDeterministic(value) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map((item) => serializeDeterministic(item)).join(',')}]`;
    }
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries
        .map(([key, item]) => `${JSON.stringify(key)}:${serializeDeterministic(item)}`)
        .join(',')}}`;
}
//# sourceMappingURL=serialization.util.js.map