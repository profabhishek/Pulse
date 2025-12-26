import logo from "../assets/icons/Square150x150Logo.png";


export default function TopBar() {
  return (
    <div className="topbar">
      {/* Center title */}
      <div className="topbar-center">
        <img src={logo} alt="Pulse" />
        <span>Pulse</span>
      </div>

      {/* Window controls */}
      <div className="window-controls">
        <button onClick={() => window.windowControls.minimize()}>—</button>
        <button onClick={() => window.windowControls.maximize()}>☐</button>
        <button
          className="close"
          onClick={() => window.windowControls.close()}
        >
          ✕
        </button>
      </div>
    </div>
  );
}