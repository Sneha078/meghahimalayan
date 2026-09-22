import {
  baseTemplate,
  styles,
  escapeHtml,
  formatMoney,
} from "./emailStyles.js";

/*
 * Renders the "New Arrivals" marketing email.
 * `products`: array of up to 4 product docs (has image[0].url, name,
 * brand, category, price, discountPrice, _id).
 * `unsubscribeUrl`: one-click unsubscribe link (sets marketingOptIn=false).
 */
export const newArrivalsTemplate = ({
  user,
  products,
  frontendUrl,
  unsubscribeUrl,
}) => {
  const userName = escapeHtml(user?.name?.split(" ")[0] || "there");

  const productCards = (products || [])
    .map((product) => {
      const name = escapeHtml(product?.name || "New Product");
      const brand = escapeHtml(product?.brand || "");
      const image = product?.image?.[0]?.url || "";
      const productUrl =
        `${frontendUrl}/product/${product?._id}`;

      const price = Number.isFinite(Number(product?.price))
        ? formatMoney(product.price)
        : "";

      const hasDiscount =
        Number.isFinite(Number(product?.discountPrice)) &&
        Number(product.discountPrice) > 0;

      const originalPrice = hasDiscount
        ? formatMoney(product.discountPrice)
        : "";

      const imageCell = image
        ? `<img
             src="${escapeHtml(image)}"
             alt="${name}"
             width="180"
             height="180"
             style="
               width:180px;height:180px;object-fit:cover;
               border-radius:8px;display:block;
             "
           >`
        : `<div style="
             width:180px;height:180px;border-radius:8px;
             background:#e2e8f0;display:flex;align-items:center;
             justify-content:center;color:#94a3b8;
             font-size:40px;font-weight:bold;
           ">${brand ? escapeHtml(brand[0].toUpperCase()) : "M"}</div>`;

      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">
            <table
              style="
                width:100%;border-collapse:collapse;
                background:#ffffff;
              "
            >
              <tr>
                <td
                  style="
                    width:190px;vertical-align:top;
                    padding-right:16px;
                  "
                >
                  ${imageCell}
                </td>

                <td
                  style="vertical-align:top;padding:8px 0;"
                >
                  <div
                    style="${styles.boldP};margin:0 0 2px 0;"
                  >
                    ${name}
                  </div>

                  <div
                    style="${styles.small};margin:0 0 8px 0;"
                  >
                    ${brand}
                  </div>

                  <div style="margin:8px 0;">
                    <span
                      style="
                        font-size:16px;font-weight:bold;
                        color:#172554;
                      "
                    >
                      ${price}
                    </span>

                    ${
                      hasDiscount
                        ? `<span
                             style="
                               font-size:12px;color:#94a3b8;
                               text-decoration:line-through;
                               margin-left:6px;
                             "
                           >
                             ${originalPrice}
                           </span>`
                        : ""
                    }
                  </div>

                  <a href="${productUrl}" style="${styles.button};margin:6px 0 0 0;">
                    Shop Now
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    <div style="text-align:center;margin-bottom:18px;">
      <div
        style="
          font-size:24px;font-weight:bold;color:#172554;
          margin-bottom:4px;
        "
      >
        ✨ New Arrivals ✨
      </div>

      <p style="${styles.p}">
        Hi ${userName}, fresh products have just landed at
        Mega Himalaya. Check out what's new before they sell out.
      </p>
    </div>

    <table
      style="
        width:100%;border-collapse:collapse;margin:15px 0;
      "
    >
      <tbody>
        ${productCards}
      </tbody>
    </table>

    <div style="text-align:center;">
      <a href="${frontendUrl}/shop" style="${styles.button}">
        View All New Arrivals
      </a>
    </div>

    ${
      unsubscribeUrl
        ? `<p style="${styles.small};text-align:center;margin-top:20px;">
             You are receiving this because you opted in to
             Mega Himalaya marketing emails.
             <a href="${unsubscribeUrl}" style="color:#f97316;">
               Unsubscribe
             </a>
           </p>`
        : ""
    }
  `;

  return baseTemplate(content, frontendUrl);
};