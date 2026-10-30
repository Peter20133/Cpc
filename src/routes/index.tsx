import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

const title = "RestoMatch — găsește restaurantul potrivit în România";
const description =
  "Caută printre mii de restaurante din România după oraș, bucătărie, buget și atmosferă, apoi rezervă direct.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <App />;
}
