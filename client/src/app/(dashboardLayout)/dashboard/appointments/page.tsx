import { redirect } from "next/navigation"

const AppointmentsRedirectPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const params = await searchParams
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item))
      return
    }

    query.set(key, value)
  })

  redirect(query.toString() ? `/dashboard/my-appointments?${query.toString()}` : "/dashboard/my-appointments")
}

export default AppointmentsRedirectPage