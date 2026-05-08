import { Router } from "express";
import { requirePrivyAuth } from "../middlewares/requirePrivyAuth";

const router = Router();

router.get("/me", requirePrivyAuth, (req, res) => {
    return res.status(200).json({
        did: req.user?.did ?? null,
        walletAddress: req.user?.walletAddress ?? null,
    });
});

router.get("/verify", requirePrivyAuth, (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            did: req.user?.did ?? null,
            walletAddress: req.user?.walletAddress ?? null,
        },
    });
});

export default router;
