import axios from "axios";

interface MyntraProduct {
  productId: string;
  productName: string;
  price: number;
  brand: string;
  image?: string;
  productUrl: string;
  articleType?: string;
  subCategory?: string;
  masterCategory?: string;
  availability?: string;

  // metadata
  totalCount?: number;
}

interface FetcherOptions {
  category?: string;
  rows?: number;
  offset?: number;
  page?: number;
  pincode?: number;
}

class FetcherService {
  private readonly baseUrl = "https://www.myntra.com/gateway/v4/search";
  private readonly defaultHeaders = {
    accept: "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    newrelic:
      "eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjMwNjIwNzEiLCJhcCI6IjcxODQwOTI1MSIsImlkIjoiYThkODViZjNlMjZiOTEzNCIsInRyIjoiYzI0YTY0MGQwNTBhOTI1OThjNjY2OWU4Y2Q5NTY2MjUiLCJ0aSI6MTc2MTI4MzQ5NTcwNywidGsiOiI2Mjk1Mjg2In19",
    "pagination-context":
      '{"scImgVideoOffset":"0_0","v":1.0,"productsRowsShown":0,"paginationCacheKey":"c057b852-f1d9-454d-a576-dd855ac32fa7","inorganicRowsShown":0,"plaContext":"eyJwbGFPZmZzZXQiOjAsIm9yZ2FuaWNPZmZzZXQiOjIwMSwiZXhwbG9yZU9mZnNldCI6MCwiZmNjUGxhT2Zmc2V0IjoxNzEsInNlYXJjaFBpYW5vUGxhT2Zmc2V0IjoxNjgsImluZmluaXRlU2Nyb2xsUGlhbm9QbGFPZmZzZXQiOjAsInRvc1BpYW5vUGxhT2Zmc2V0IjozLCJvcmdhbmljQ29uc3VtZWRDb3VudCI6MTUxLCJhZHNDb25zdW1lZENvdW50IjoxNzEsImV4cGxvcmVDb25zdW1lZENvdW50IjowLCJjdXJzb3IiOnt9LCJwbGFzQ29uc3VtZWQiOltdLCJhZHNDb25zdW1lZCI6W10sIm9yZ2FuaWNDb25zdW1lZCI6W10sImV4cGxvcmVDb25zdW1lZCI6W119","refresh":false,"scOffset":0,"reqId":"2e205c8a-66bf-4888-ae31-1ca122875a76"}',
    priority: "u=1, i",
    "sec-ch-ua": '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    traceparent: "00-c24a640d050a92598c6669e8cd956625-a8d85bf3e26b9134-01",
    tracestate: "6295286@nr=0-1-3062071-718409251-a8d85bf3e26b9134----1761283495707",
    "x-device-state": "",
    "x-location-context": "pincode=500032;source=USER",
    "x-meta-app": "appFamily=MyntraRetailMweb;",
    "x-myntra-abtest":
      "config.bucket=regular;pdp.desktop.savedAddress=enabled;coupon.cart.channelAware=channelAware_Enabled;returns.obd=enabled;refund.tracker.myorders=Test;cart.cartfiller.personalised=enabled;payments.mcotp.disable=enabled",
    "x-myntra-app": "deviceID=1fdfc686-f903-4bb7-bdce-e2ecc4ee2c72;reqChannel=web;appFamily=MyntraRetailMweb;",
    "x-myntraweb": "Yes",
    "x-requested-with": "browser",
    cookie:
      "_d_id=1fdfc686-f903-4bb7-bdce-e2ecc4ee2c72; mynt-eupv=1; _gcl_au=1.1.1433263186.1754405220; _cs_c=1; tvc_VID=1; _scid=Us9G_KfNuhRLREDk39GhBGDUAnwuvj4l; _sctr=1%7C1754332200000; G_ENABLED_IDPS=google; __insp_wid=617845923; __insp_slim=1754405224759; __insp_nv=true; __insp_targlpu=aHR0cHM6Ly93d3cubXludHJhLmNvbS9sb2dpbj9yZWZlcmVyPWh0dHBzJTNBJTJGJTJGd3d3Lm15bnRyYS5jb20lMkY%3D; __insp_targlpt=TXludHJh; __insp_norec_sess=true; ilgim=true; user_uuid=0606a8d1.3082.4a42.898f.3c8e1f746097viWUvzIhZV; __utma=147427048.1069222761.1754405265.1754405265.1754405265.1; __utmz=147427048.1754405265.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); _ga=GA1.2.1069222761.1754405265; _scid_r=b09G_KfNuhRLREDk39GhBGDUAnwuvj4lmsm-Rw; uidx=0606a8d1.3082.4a42.898f.3c8e1f746097viWUvzIhZV; oai=426534845; oaui=426534845:5; mynt-ulc=pincode%3A500032%7CaddressId%3A426534845; mynt-ulc-api=pincode%3A500032%7CaddressId%3A426534845; mynt-loc-src=expiry%3A1761141578255%7Csource%3AUSER; _mxab_=config.bucket%3Dregular%3Bpdp.desktop.savedAddress%3Denabled%3Bcoupon.cart.channelAware%3DchannelAware_Enabled%3Breturns.obd%3Denabled%3Brefund.tracker.myorders%3DTest%3Bcart.cartfiller.personalised%3Denabled%3Bpayments.mcotp.disable%3Denabled; _pv=default; microsessid=898; x-mynt-userConsent=%7B%22blockingType%22%3Anull%7D; lt_timeout=1; lt_session=1; at=ZXlKcmFXUWlPaUl5SWl3aWRIbHdJam9pU2xkVUlpd2lZV3huSWpvaVVsTXlOVFlpZlEuZXlKemRXSWlPaUl3TmpBMllUaGtNUzR6TURneUxqUmhOREl1T0RrNFppNHpZemhsTVdZM05EWXdPVGQyYVZkVmRucEphRnBXSWl3aVlYQndUbUZ0WlNJNkltMTViblJ5WVNJc0ltbHpjeUk2SWtsRVJVRWlMQ0owYjJ0bGJsOTBlWEJsSWpvaVlYUWlMQ0p6ZEc5eVpVbGtJam9pTWpJNU55SXNJbXh6YVdRaU9pSTRZMlJtTkRBd1lpMWhZakZtTFRReU1qY3RZakE0T1Mwd05HUXhOR0poWm1KaE5tSXRNVGMxTkRRd05USTBNRFEyT1NJc0luQWlPaUl5TWprM0lpd2lZWFZrSWpvaWJYbHVkSEpoTFRBeVpEZGtaV00xTFRoaE1EQXROR00zTkMwNVkyWTNMVGxrTmpKa1ltVmhOV1UyTVNJc0luQndjeUk2TVRBc0ltTnBaSGdpT2lKdGVXNTBjbUV0TURKa04yUmxZelV0T0dFd01DMDBZemMwTFRsalpqY3RPV1EyTW1SaVpXRTFaVFl4SWl3aWMzVmlYM1I1Y0dVaU9qQXNJbk5qYjNCbElqb2lRa0ZUU1VNZ1VFOVNWRUZNSWl3aVpYaHdJam94TnpZeE1qZzNNRFU0TENKdWFXUjRJam9pTURjMlkyUTBObVl0TnpJd1lpMHhNV1l3TFRrd1pEa3RaVEkyTWpZMFlXUmhNMlV5SWl3aWFXRjBJam94TnpZeE1qZ3pORFU0TENKMWFXUjRJam9pTURZd05tRTRaREV1TXpBNE1pNDBZVFF5TGpnNU9HWXVNMk00WlRGbU56UTJNRGszZG1sWFZYWjZTV2hhVmlKOS5jTlZLbjlmT2pPY2thcHFBYUJsMU81c0pjdXEtYmNOYWZ0Q1g3ZV95TmVxTFJrUkozdTJlRzh5OXBwaXZFalY0Rm9HSFRyWnpRUDduS0dfYWhVQmU5RTF2SEFDVGlBMHVBRTUwdXg0OHU4VnRFT0FLQmo4UHhuSHdydFQ5eXl4Z2kxelZEeHpLRk5NamtPakpLcjAwWldzX0dRQTZGdGxEME9lZUNnUlF4ZUU=; rt=ZXlKcmFXUWlPaUl5SWl3aWRIbHdJam9pU2xkVUlpd2lZV3huSWpvaVVsTXlOVFlpZlEuZXlKemRXSWlPaUl3TmpBMllUaGtNUzR6TURneUxqUmhOREl1T0RrNFppNHpZemhsTVdZM05EWXdPVGQyYVZkVmRucEphRnBXSWl3aWNuUnBkeUk2TWpNek1qZ3dNREFzSW1Gd2NFNWhiV1VpT2lKdGVXNTBjbUVpTENKcGMzTWlPaUpKUkVWQklpd2lkRzlyWlc1ZmRIbHdaU0k2SW5KMElpd2ljM1J2Y21WSlpDSTZJakl5T1RjaUxDSnNjMmxrSWpvaU9HTmtaalF3TUdJdFlXSXhaaTAwTWpJM0xXSXdPRGt0TURSa01UUmlZV1ppWVRaaUxURTNOVFEwTURVeU5EQTBOamtpTENKd0lqb2lNakk1TnlJc0ltRjFaQ0k2SW0xNWJuUnlZUzB3TW1RM1pHVmpOUzA0WVRBd0xUUmpOelF0T1dObU55MDVaRFl5WkdKbFlUVmxOakVpTENKMGIyNGlPakUzTmpFeU9ETTBOVGdzSW5Cd2N5STZNVEFzSW5KMGRDSTZNU3dpWTJsa2VDSTZJbTE1Ym5SeVlTMHdNbVEzWkdWak5TMDRZVEF3TFRSak56UXRPV05tTnkwNVpEWXlaR0psWVRWbE5qRWlMQ0p6ZFdKZmRIbHdaU0k2TUN3aWMyTnZjR1VpT2lKQ1FWTkpReUJRVDFKVVFVd2lMQ0psZUhBaU9qRTNPRFEyTVRFME5UZ3NJbTVwWkhnaU9pSXdOelpqWkRRMlppMDNNakJpTFRFeFpqQXRPVEJrT1MxbE1qWXlOalJoWkdFelpUSWlMQ0pwWVhRaU9qRTNOakV5T0RNME5UZ3NJblZwWkhnaU9pSXdOakEyWVRoa01TNHpNRGd5TGpSaE5ESXVPRGs0Wmk0ell6aGxNV1kzTkRZd09UZDJhVmRWZG5wSmFGcFdJbjAuTDkzaXZXOV95X08wcU83aGsyaENBa3IwMk54VUpnR3BodVItYmRYYVNGYS1JY01uZlAxTF9QbWNGOGZWQzVNUmNBTTljdFZmSFRCWUJoUDFrNjZObklmd09uSGJra3RWSWN4b1JEekxxQUdoY2pDa1VQOUxFX19zdjJYTU90cVd5Y1FrVmh1M2ZJR1dNa1UzNllkaE03Q1NJMFZnbFlYSmc3T1huM0VEOFpr; _ma_session=%7B%22id%22%3A%22ae333674-5de6-4355-a0e6-18b315968f53-1fdfc686-f903-4bb7-bdce-e2ecc4ee2c72%22%2C%22referrer_url%22%3A%22%22%2C%22utm_medium%22%3A%22%22%2C%22utm_source%22%3A%22%22%2C%22utm_channel%22%3A%22direct%22%7D; x-mynt-pca=KHCKOkoSjj3l3UjdsdYTmuOGhmJDwet1iHzbHvIDkqsSDn1vpA5-oafWIgBiyAyzhvs_B5IC8m1VNuulnsUp2LbHPrWdXiJlKcfl7rbCaOevg9qokQJLoyclOahh4k4cGz8SLT0wCJSS-TPon-230KdYh7P3yJesiMKCbMqM2cpnhHwSlOj4immNllztSzdfP2PxjCgrRdIlwf0RwepTjRjpT7I%3D; _xsrf=xUgDOnAqQGR87Qyrb0c2yVsfV6VYsGtV; user_session=QWR0fnMMCnGqWHtRLalvVg.H-f2r8hhjK4zB_fziWoK3wOBVON7bv6LZf-y85xLp-w2v4QToz5WllMvUgryFQAp5mE7YRwb-RggIJ-qLGwSslK01-QnvQMmUCZMrXwdwp21yiztFRIHK1PRy1Zib2hzDq2mLYYPWLR0UqOdd5pXxo84VBkaVGWQNMW59Zh51CEYtX4K--bnjDUS-MQ-_mrlm-dokDYFJhi9b1qF07jI-SVVQBzCvkXy9qeSjYIuvIAllS_SmpBzl841FuFOmahhWqRWk9y2vGkL2UBpVC95MQGEN3W3Ed_NH0Do_PSAqZHpTLrHaLbHPxjEeJfMqdEz8zyYUqFIa1VFvqVpxqBng3x98lmOB-n4NW-9wfCoLd9nvG2AftJnPnWJS7EdbX1b1zbb9CpAUOO2GmaWD7hkZrcVlQDbV0u5QuMDurcNkW2PN3kY2eoyKOya-6-WpoVOKCiC5z7_IyxAuNVu6W3WqRrK5anc-uPpi2F5MvNWqHs17m_a8_TBev4cv8OFYSBX.1761283458637.86400000.3erENZFO3J-MANT2bOs8h-jGmhm59lPfiYx0QQDPyu8; newUser=false; bm_mi=C0219574126A32392C18914459758839~YAAQXXBWuCewQhKaAQAAjOqsFB3rK9XwRD1bOsBr+JeZxqofGGZn04iLlWzNsnQXxIuaqLauBazNeHRL6qfnduSAsHx9JfUlSvYizogFH7XRg39KoenU9S6kca+bjmO5FKtRl+gO77Ka1YJrCSQjy/9cKC+p80PiPM+RfRi6ZD0gZI9mYFBLASy75bSvznMvskSwO7aOkRHEgiGzaJHvhvSn6GqVXHN4DAUwpxtVKS7fZTsNm4dECw1s1hPOrAgMxIe0lSVBfRUag0c6dCwxsqDnqiDJfmL6azstWHKZw6E78cWsygboH3mblgBX2BbPUoBX0kZ7V3I=~1; ismd=1; ak_bmsc=7992A5A04A75212E43C7DD5726F46160~000000000000000000000000000000~YAAQXXBWuNDQQhKaAQAAcgytFB3lPfJOn6FF7nHYSU/BbT5OiS0eeD2/vJwk+IFSobu34I7zxZ/zd/o11+tSyzD70n2bfTxyAvpRF/NKBW/4AHBfw3xkqbN+dbjB8WbGfbjyL1hdAuxm1Qm85HED92X6PqUi+RPW+qNy95dVsIRGo9eQzQOwIm6HXNQxEjNvCgqWsKXveqU/V9IPJklfa6+cOfe67cBdrUY3v2xtrSzoKXmdn3dFxD+BEsPtpCmso4Yy/BmJV7+/JnCbGVxfLZYTXeicNDJoRebcOK7y67T21pXiMHUngciBaZArd6bOjyyZSSOSvxCn5ZKL8nULy2gF1rliBLjTC6fc10kZSqnmm4JxKMXKWGUU2ptz9eja4S37SkxHYLnm3DV86Cyk7ZOBCJh5hZmmDPM=; bm_sz=C2C686CE5899D17EBC325600E697B97F~YAAQXXBWuNLQQhKaAQAAcgytFB3y8029lrWd6DR1Y/VADEz4Fb4mk22rIslv5PMHZE9DVVgx4pHR7mqaA0G1aQjCO5EvGAFM+iEX+vifGpP8/nc8aC4Cl7gSJUzHAHfxFV5K+R/ENvROfQfVFcjX2kL1+pM61Dc5M/GIm4qLa1gvkmMRNUKxbWLN9e0zgnh81VixrVx+Ru7X9NxNb9P1kfjhJa3qOkvq5FUQOszpsb7/ndwS0XQRw84UIWhlfNkLbIWHnbT1iJtIKiWY5rJjd3CDvHQEB1t73VBeExuqVGgpXO9u/T7GSHKIUl4k1G9wBSwx+9ySYpk+nBHyB+v22+SkwOvqhMiqjz+Dr3lnQEIoFNPwYymoeUtR/DUKq5wvJUHhzApiNefE2R8IBDi+TphM5gvbDBbn~3420997~3160370; _abck=EB45A13411ECF9859DC297D69E2C8BB0~0~YAAQXXBWuAbSQhKaAQAA4Q2tFA7fs8o586uSooWN/fkqMISlGIHUve45Ldi7vFtTSeayrcmtZ20s3pTcDjBtdVR0Pj7zY4vT//hsK7o1daK47vNXpgSVrCLFeF+gsky9BwILAzwQFZuFb8r+cn+EdwmSRjWaeMp/8+aCY32N23v2tUoJGzTZU1aSKd+Xaws4w/e//ZZjhmKzh710L8D8zRZopNQM1cCgWmDP7XQdpUiLfdLcCvmFtsBKmpWpZeFl689kD92FUi+JmXQjsSGZuqMSlOJklfRAVEzEhfhKIkYzKAfECadcPF+8zw5kRZablRYLB5sdPFouBh0oXITu/fNSxYKCOinFn4k1NvDIGG4ms2zLe9aUgWWHCoQans6d+jcFZfKPdW6++aXmUF6Z53LFgEipS+IQhKwD+AwU+z/fNp9xeyt5WIg/WpQ+wa0RHsy0YBvdIoZBZXXl8MUWGIdLr9Q24zikheSfKqxZy3KzOwJ8zbcJoBGclS7XatCY1wA+r5MJ/nefsRUmCHWHLloVwtvD7KtXnQ+PR3u26AHxTlkAwvPIABN3YXAW/79tjRnif1BLT2f3hcA+wjWS0NY0rU0VujOT8ZuFLHilW0THp6zOayjb2rs6x474e6mgqvlQ8TYysYgu+fpzygVQXsveywm/mw5RICbydmhL4CMGB20IamrS6yQK/ghyfNvVbYthcY08bU3OTZMi90DMJZ9Z9zo2t18yNkXRFOpDLZqSd5DZp5QhzIQdKuXh78Oih87PqoDkp2Xxf8g4RwUHOqYKHEwkw8cGcIzisBgAXX82aFGz+knGwSM/YWANgVWih58k+rL3F6q3jL/tbVbD~-1~-1~-1~AAQAAAAE%2f%2f%2f%2f%2f2XCBg1llHiHwlAH6oUanZnEXkMwq9rj0UI3Vz96Htsbiaak+CfL%2fO6W2VUjbAGn1UrXiBBZ8HkdplEyi%2fXsyDolAUecarTILrMF~-1; dp=m; utm_track_v1=%7B%22utm_source%22%3A%22direct%22%2C%22utm_medium%22%3A%22direct%22%2C%22trackstart%22%3A1761283477%2C%22trackend%22%3A1761283537%7D; ru=XUxuZloLTnJ9F2V4TxQKVUdLEmlNHgoTcSsHTHAtEk9eGF4fVyUPASQjLV13b0AwIzI2ODY3MDUwNSQy.43cd14e965580f768cf09b9b6847c966; utrid=uuid-17544052143399; bm_sv=85891D06CCEDA473A0561F46A5900D63~YAAQXXBWuPIQQxKaAQAAflCtFB3pEejIep4A0dCN9UA/pmgyJKzkP0lHkY7KKy5WE6O6VZejNwvM6TDWOC87tZrCf3uclBZJx1ZhPPsTsA73P90FHDCI6guH8JXznlyxx1MowJVxEaGHuuxGk3dehtV8UZQshXuFj+k7SmgVm4TB1ZvBJYvCrdRhmvNglJgaUxs02ZLD5LeE3mLIPghagUi5gA87xJqlQw8BvhCE2vBMPbjCNZkzl1/OgArk6w/FtA==~1",
    Referer: "https://www.myntra.com/men-tshirts?p=2",
  };

  /**
   * Fetch products from Myntra API
   * @param category - Product category (e.g., "Tshirts", "Shirts", "Jeans")
   * @param options - Additional fetch options
   * @returns Promise with array of products
   */
  async fetchMyntraProducts(category: string, options: FetcherOptions = {}): Promise<MyntraProduct[]> {
    const { rows = 50, offset = 0, page = 1, pincode = 500082 } = options;

    try {
      const url = `${this.baseUrl}/men-tshirts`;
      const params = new URLSearchParams({
        f: `Categories:${category}`,
        rows: rows.toString(),
        o: offset.toString(),
        plaEnabled: "true",
        xdEnabled: "false",
        isFacet: "true",
        p: page.toString(),
        pincode: pincode.toString(),
      });

      const promise = fetch(`${url}?${params.toString()}`, {
        method: "GET",
        headers: this.defaultHeaders,
      }).then((res) => res.json());
      const response = await promise;
      console.log(`${url}?${params.toString()}`);

      const products = response?.products || [];
      const plaProducts = response?.plaProducts || [];
      products.push(...plaProducts);
      const totalCount = response?.totalCount || 0;
      return this.transformMyntraProducts(products, totalCount);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch Myntra products: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Transform raw Myntra API response to standardized product format
   */
  private transformMyntraProducts(rawProducts: any[], totalCount: number): MyntraProduct[] {
    return rawProducts.map((product) => ({
      productId: product.productId || product.id || "",
      productName: product.productName || product.name || "",
      price: product.price || 0,
      brand: product.brand || "",
      image: product.searchImage || "",
      productUrl: `https://www.myntra.com/${product.landingPageUrl}`,
      category: product.category || product.productType || "",
      availability: this.determineAvailability(product),
      articleType: product.articleType?.typeName || undefined,
      subCategory: product.subCategory?.typeName || undefined,
      masterCategory: product.masterCategory?.typeName || undefined,
      totalCount: totalCount || 0,
    }));
  }

  /**
   * Determine product availability from raw product data
   */
  private determineAvailability(product: any): string {
    if (product.inventoryInfo) {
      const available = product.inventoryInfo.find((info: any) => info.available);
      if (available) return "In Stock";
    }

    if (product.inStock === false) {
      return "Out of Stock";
    }

    // Default to In Stock if no explicit inventory info
    return "In Stock";
  }

  /**
   * Fetch products with pagination
   * @param category - Product category
   * @param page - Page number (1-indexed)
   * @param itemsPerPage - Number of items per page
   * @param pincode - Delivery pincode
   */
  async fetchWithPagination(category: string, page: number = 1, itemsPerPage: number = 50, pincode?: number): Promise<MyntraProduct[]> {
    const offset = (page - 1) * itemsPerPage;
    return this.fetchMyntraProducts(category, {
      rows: itemsPerPage,
      offset,
      page,
      pincode,
    });
  }

  /**
   * Fetch multiple pages of products
   * @param category - Product category
   * @param totalPages - Number of pages to fetch
   * @param itemsPerPage - Items per page
   */
  async fetchMultiplePages(category: string, totalPages: number, itemsPerPage: number = 50): Promise<MyntraProduct[]> {
    const promises = Array.from({ length: totalPages }, (_, i) => this.fetchWithPagination(category, i + 1, itemsPerPage));

    const results = await Promise.allSettled(promises);

    return results.filter((result) => result.status === "fulfilled").flatMap((result) => (result as PromiseFulfilledResult<MyntraProduct[]>).value);
  }
}

export default new FetcherService();
