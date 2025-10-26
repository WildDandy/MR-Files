export interface FolderReference {
  id: string
  full_path: string
  normalizedPath?: string
}

export function normalizeDrivePath(path: string | null | undefined): string {
  if (!path) {
    return ""
  }

  let cleaned = path.trim().toLowerCase()

  cleaned = cleaned.replace(/\\+/g, "/")
  cleaned = cleaned.replace(/%2f/gi, "/")
  cleaned = cleaned.replace(/%20/gi, " ")
  cleaned = cleaned.replace(/\+/g, " ")
  cleaned = cleaned.replace(/[?#].*$/, "")

  cleaned = cleaned.replace(/^https?:\/\/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//, "")
  cleaned = cleaned.replace(/^https?:\/\/drive\.google\.com\/file\/d\//, "")
  cleaned = cleaned.replace(/^https?:\/\/drive\.google\.com\/open\?id=/, "")
  cleaned = cleaned.replace(/^https?:\/\/drive\.google\.com\/uc\?id=/, "")
  cleaned = cleaned.replace(/^https?:\/\/drive\.google\.com\/.*?\/folders\//, "")

  cleaned = cleaned.replace(/^drive\//, "")
  cleaned = cleaned.replace(/^my drive\//, "")
  cleaned = cleaned.replace(/^shared drives\//, "")
  cleaned = cleaned.replace(/^shared with me\//, "")
  cleaned = cleaned.replace(/^team drives\//, "")

  cleaned = cleaned.replace(/^\/+/g, "")
  cleaned = cleaned.replace(/\s+/g, " ")
  cleaned = cleaned.replace(/\/+/g, "/")
  cleaned = cleaned.replace(/\/$/, "")

  return cleaned
}

export function bestFolderMatch<T extends FolderReference>(
  path: string | null | undefined,
  folders: T[],
): T | null {
  const normalizedPath = normalizeDrivePath(path)
  if (!normalizedPath) {
    return null
  }

  let bestMatch: T | null = null
  let bestNormalized = ""

  for (const folder of folders) {
    const folderNormalized = folder.normalizedPath ?? normalizeDrivePath(folder.full_path)
    if (!folderNormalized) {
      continue
    }

    const matches =
      normalizedPath === folderNormalized || normalizedPath.startsWith(`${folderNormalized}/`)

    if (!matches) {
      continue
    }

    if (folder.normalizedPath === undefined) {
      ;(folder as FolderReference).normalizedPath = folderNormalized
    }

    if (!bestMatch || folderNormalized.length > bestNormalized.length) {
      bestMatch = folder
      bestNormalized = folderNormalized
    }
  }

  return bestMatch
}
