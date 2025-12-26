import logo from "../assets/icons/Square150x150Logo.png";

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="topbar-center">
        <img src={logo} alt="Pulse" />
        <span>Pulse</span>
      </div>
    </div>
  );
}
