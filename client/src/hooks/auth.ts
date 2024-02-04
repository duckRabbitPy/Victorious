import { useEffect, useState } from "react";
import { uuidv4 } from "../../../shared/utils";
import { API_ENDPOINT } from "../constants";

const getLoggedInUserName = async () => {
  const authToken = localStorage.getItem("victorious_auth_token");

  if (!authToken) {
    return null;
  }
  console.log("endpoint", API_ENDPOINT);
  try {
    const response = await fetch(`${API_ENDPOINT}/auth`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const json = await response.json();
    console.log("json", json);
    return (json?.username as string) || null;
  } catch (error) {
    return null;
  }
};

export const useGetLoggedInUsername = () => {
  const [loggedInUsername, setLoggedInUsername] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState<string>(uuidv4());

  const refetchLoginStatus = () => {
    setRefetchKey(uuidv4());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getLoggedInUserName();
        console.log("result", result);
        setLoggedInUsername(result);
      } catch (error) {
        setLoggedInUsername(null);
      }
    };

    fetchData();
  }, [refetchKey]);

  return { loggedInUsername, refetchLoginStatus };
};
