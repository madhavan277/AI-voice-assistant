import Vapi from "@vapi-ai/web";

let vapiInstance = null;

const getVapi = () => {
  if (!vapiInstance) {
    const apiKey = import.meta.env.VITE_VAPI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing VITE_VAPI_API_KEY");
    }
    vapiInstance = new Vapi(apiKey);
  }
  return vapiInstance;
};

const assistantId = import.meta.env.VITE_ASSISTANT_ID;

export const startAssistant = async (firstName, lastName, email, phone) => {
  if (!assistantId) {
    throw new Error("Missing VITE_ASSISTANT_ID");
  }

  const vapi = getVapi();

  const assistantOverrides = {
    variableValues: {
      firstName,
      lastName,
      email,
      phone
    }
  };

  return await vapi.start(assistantId, assistantOverrides);
};

export const stopAssistant = () => {
  if (vapiInstance) {
    vapiInstance.stop();
  }
};
