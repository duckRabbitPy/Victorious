import { useEffect, useState } from "react";
import { uuidv4 } from "../../../shared/utils";
import { API_ENDPOINT, LOCAL_STORAGE_AUTH_KEY } from "../constants";

const getLoggedInUserName = async () => {
  const authToken = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);

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
  const [loading, setLoading] = useState<boolean>(true);
  const [refetchKey, setRefetchKey] = useState<string>(uuidv4());

  const refetchLoginStatus = () => {
    setRefetchKey(uuidv4());
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getLoggedInUserName();
        setLoggedInUsername(result);
        setLoading(false);
      } catch (error) {
        setLoggedInUsername(null);
      }
    };

    fetchData();
  }, [refetchKey]);

  return { loggedInUsername, refetchLoginStatus, loading };
};
