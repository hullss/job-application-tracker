export default {
  async fetch(request, environment) {
    const response = await environment.ASSETS.fetch(request)
    const acceptsHtml = request.headers.get('accept')?.includes('text/html')

    if (
      request.method === 'GET' &&
      response.status === 404 &&
      acceptsHtml
    ) {
      const indexUrl = new URL('/index.html', request.url)
      return environment.ASSETS.fetch(new Request(indexUrl, request))
    }

    return response
  },
}
