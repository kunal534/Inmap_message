"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmailController_1 = require("../controllers/EmailController");
const router = (0, express_1.Router)();
router.get('/', EmailController_1.EmailController.getEmails);
router.post('/search', EmailController_1.EmailController.searchEmails);
router.get('/:id', EmailController_1.EmailController.getEmailById);
router.get('/categories/stats', EmailController_1.EmailController.getCategoryStats);
router.post('/sync', EmailController_1.EmailController.triggerSync);
router.get('/status/connection', EmailController_1.EmailController.getConnectionStatus);
exports.default = router;
//# sourceMappingURL=email.routes.js.map