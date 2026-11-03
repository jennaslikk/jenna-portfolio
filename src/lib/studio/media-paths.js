export function isPublicMediaPath(value) {
 return typeof value === 'string' && /^\/(images|videos|projects)\/[a-z0-9_ .\/-]+\.(png|jpe?g|webp|gif|avif|mp4|webm)$/i.test(value)
  && !value.includes('..') && !/usa[-_]valentines|berry[ _-]*lovely/i.test(value);
}

