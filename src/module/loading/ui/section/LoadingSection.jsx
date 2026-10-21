import BootScreen from "../components/BootScreen";
import LoginScreen from "../components/LoginScreen";

const LoadingSection = ({ booting, isLoggedIn, isMobile, onBootComplete, onLogin }) => (
  <>
    {booting && <BootScreen onComplete={onBootComplete} isMobile={isMobile} />}
    {!isLoggedIn && <LoginScreen onLogin={onLogin} isMobile={isMobile} active={!booting} />}
  </>
);

export default LoadingSection;
