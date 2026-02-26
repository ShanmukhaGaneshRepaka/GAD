import "./Overlay.css";
// const Overlay = ({ children, onClose }) => {
//   return (
//     <div className="overlay" onClick={onClose}>
//       <div className="overlay-center" onClick={(e) => e.stopPropagation()}>
//         {children}
//       </div>
//     </div>
//   );
// };

const Overlay = ({ children, onClose }) => {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)", // darker
        backdropFilter: "blur(6px)",            // stronger blur
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Overlay;


// export default Overlay;
