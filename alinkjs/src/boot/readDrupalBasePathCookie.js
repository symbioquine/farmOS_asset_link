import Cookies from 'js-cookie'

export default ({ app, router, store }) => {
  window.assetLinkDrupalBasePath = Cookies.get('assetLinkDrupalBasePath');
}
