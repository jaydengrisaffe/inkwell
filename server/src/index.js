import express from "express";
import healthRoutes from "./routes/health.routes.js";


const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use("/api", healthRoutes);

app.listen(PORT, () => {
 console.log(`Inkwell API listening on port ${PORT}`);
});