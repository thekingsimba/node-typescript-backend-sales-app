import { Router } from 'express';

import { verifyUser } from '../../middleware/auth';
import {
    deleteNotification,
    notification_list,
    notify_all_user,
    notify_one_user,
    send_message_to_topic,
    update_status,
} from './notification.controller';


const router = Router();

router.get("/list", notification_list);
router.delete("/delete", deleteNotification);
router.put("/update", verifyUser, update_status);
router.put("/notify-one-user", verifyUser, notify_one_user);
router.put("/notify-all-user", verifyUser, notify_all_user);
router.post("/send-message-to-topic", send_message_to_topic)

export { router as notificationRoutes }