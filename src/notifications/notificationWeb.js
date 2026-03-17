import apiClient from "../services/apiClient";
 
export async function saveFcmTokenWeb(applicantId, jwtToken, fcmToken) {
  try {
    const deviceName = navigator.userAgent || "Web Browser";
    console.log(" Generated FCM token (Web):", fcmToken);
    localStorage.setItem("fcmToken", fcmToken);
 
    if (!fcmToken) {
      console.warn("⚠️ No FCM token retrieved (Web)");
      return;
    }
 
    const payload = {
      applicantId,
      fcmToken,
      deviceName,
    };
 
    console.log("📩 Saving FCM payload (Web):", payload);
 
    const response = await apiClient.post(
      `/notification/saveFcmToken/${applicantId}`,
      payload
    );
 
    console.log("✅ FCM saved (Web):", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Failed to save FCM (Web):",
      error.response?.data || error.message
    );
    throw error;
  }
}