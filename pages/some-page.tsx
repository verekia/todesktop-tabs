const bc = new BroadcastChannel("test_channel");

export default function SomePage() {
  return (
    <div>
      Some Page -{" "}
      <a
        href="/some-page"
        target="_blank"
        onClick={(e) => {
          e.preventDefault();
          bc.postMessage({
            type: "NEW_TAB",
            url: "http://localhost:3000/some-page",
          });
        }}
      >
        New tab
      </a>
    </div>
  );
}
