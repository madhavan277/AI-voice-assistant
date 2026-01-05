import Vapi from "@vapi/web";

export const vapi = new Vapi(import.meta.env.VITE_VAPI_API_KEY);

export const startAssistant = async (firstName, lastName, email, phone) => {
  return await vapi.start({
    assistantId: import.meta.env.VITE_ASSISTANT_ID,
    metadata: { firstName, lastName, email, phone }
  });
};

export const stopAssistant = () => {
  vapi.stop();
};
