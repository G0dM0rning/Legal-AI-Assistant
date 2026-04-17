import { useContext } from "react";
import AuthContext from "../contexts/AuthContext";

// Core hook
const useAuth = () => {
  return useContext(AuthContext);
};

// Export as default and named
export default useAuth;
export { useAuth };
