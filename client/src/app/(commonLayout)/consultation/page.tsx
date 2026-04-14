import DoctorsList from "@/components/modules/Consultation/DoctorsList";
import { getAllSpecialties, getDoctors } from "@/services/doctor.services";
import { getUserInfo } from "@/services/auth.services";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

const SPECIALTIES_FILTER_KEY = "specialties.specialty.title";
const APPOINTMENT_FEE_FILTER_KEY = "appointmentFee";

const CONSULTATION_ALLOWED_QUERY_KEYS = new Set([
  "page",
  "limit",
  "sortBy",
  "sortOrder",
  "searchTerm",
  "gender",
  SPECIALTIES_FILTER_KEY,
  `${APPOINTMENT_FEE_FILTER_KEY}[gte]`,
  `${APPOINTMENT_FEE_FILTER_KEY}[lte]`,
]);

const ConsultationPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const queryParamsObjects = await searchParams;

  const normalizedQueryParams = new URLSearchParams();

  Object.keys(queryParamsObjects).forEach((key) => {
    if (!CONSULTATION_ALLOWED_QUERY_KEYS.has(key)) {
      return;
    }

    const rawValue = queryParamsObjects[key];
    if (rawValue === undefined) {
      return;
    }

    if (Array.isArray(rawValue)) {
      rawValue.forEach((value) => {
        const normalizedValue = value.trim();
        if (normalizedValue) {
          normalizedQueryParams.append(key, normalizedValue);
        }
      });
      return;
    }

    const normalizedValue = rawValue.trim();
    if (normalizedValue) {
      normalizedQueryParams.set(key, normalizedValue);
    }
  });

  const queryString = normalizedQueryParams.toString();
  const currentUser = await getUserInfo();

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["doctors", queryString],
    queryFn: () => getDoctors(queryString),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
  });

  await queryClient.prefetchQuery({
    queryKey: ["specialties"],
    queryFn: getAllSpecialties,
    staleTime: 1000 * 60 * 60 * 6,
    gcTime: 1000 * 60 * 60 * 24,
  });
 return (
   <HydrationBoundary state={dehydrate(queryClient)}>
      <DoctorsList
        initialQueryString={queryString}
        isAuthenticated={Boolean(currentUser)}
        viewerRole={currentUser?.role ?? null}
      />
   </HydrationBoundary>
 );
}

export default ConsultationPage