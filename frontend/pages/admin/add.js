import { Box, Button, Flex, Heading, Input, useToast, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@chakra-ui/react"
import axios from "axios"
import { Field, Form, Formik } from "formik"
import { withUrqlClient } from "next-urql"
import Head from "next/head"
import { useRouter } from "next/router"
import HoursInput from "../../src/components/HoursInput"
import { useAddLocationMutation } from "../../src/generated/graphql"
import { createUrqlClient } from "../../src/utils/createUrqlClient"
import styles from "../../styles/Home.module.css"
import { EmptyLocationObject } from "../../src/utils/EmptyLocationObject"
import { ArrowBackIcon } from "@chakra-ui/icons"
import Link from "next/link"

async function timeConversion(s) {
  const ampm = s.slice(-2).toUpperCase()
  const hours = Number(s.slice(0, 2))
  let time = s.slice(0, -2)
  if (ampm === "AM") {
    if (hours === 12) {
      // 12am edge-case
      return time.replace(s.slice(0, 2), "00").trim()
    }
    return time.trim()
  } else if (ampm === "PM") {
    if (hours !== 12) {
      return time.replace(s.slice(0, 2), String(hours + 12)).trim()
    }
    return time.trim() // 12pm edge-case
  }
  return "Error: AM/PM format is not valid"
}

const Location = () => {
  const router = useRouter()

  const toast = useToast()
  const [newLocation, setNewLocation] = useAddLocationMutation()

  const {
    address,
    description,
    hours,
    name,
    c_cateringURL,
    c_infoBanner,
    c_locationHighlights,
    c_locationName,
    c_locationShortName,
    c_locationSlug,
    c_mapTile,
    c_mapUrl,
    c_oloID,
    c_promoUrl,
    c_shortDescription,
    geocodedCoordinate,
    mainPhone,
    visible,
    c_comingSoonText,
    comingSoon,
    c_masthead,
    c_promoGraphic,
    orderUrl,
  } = EmptyLocationObject

  async function addLocation(location) {
    const url = `http://localhost:4000/hooks/yext`
    let hoursObject = {
      monday: {
        openIntervals: [{ start: location.mondayOpen, end: location.mondayClose }],
      },
      tuesday: {
        openIntervals: [{ start: location.tuesdayOpen, end: location.tuesdayClose }],
      },
      wednesday: {
        openIntervals: [{ start: location.wednesdayOpen, end: location.wednesdayClose }],
      },
      thursday: {
        openIntervals: [{ start: location.thursdayOpen, end: location.thursdayClose }],
      },
      friday: {
        openIntervals: [{ start: location.fridayOpen, end: location.fridayClose }],
      },
      saturday: {
        openIntervals: [{ start: location.saturdayOpen, end: location.saturdayClose }],
      },
      sunday: {
        openIntervals: [{ start: location.sundayOpen, end: location.sundayClose }],
      },
    }
    await Object.keys(hoursObject).map(async (day) => {
      if (hoursObject[day].openIntervals[0].start) {
        hoursObject[day].openIntervals[0].start = await timeConversion(hoursObject[day].openIntervals[0].start)
      }
    })
    await Object.keys(hoursObject).map(async (day) => {
      if (hoursObject[day].openIntervals[0].end) {
        hoursObject[day].openIntervals[0].end = await timeConversion(hoursObject[day].openIntervals[0].end)
      }
    })

    let deleteKeys = [
      "fridayClose",
      "fridayOpen",
      "line1",
      "mondayClose",
      "mondayOpen",
      "postalCode",
      "saturdayClose",
      "saturdayOpen",
      "state",
      "sundayClose",
      "sundayOpen",
      "thursdayClose",
      "thursdayOpen",
      "tuesdayClose",
      "tuesdayOpen",
      "wednesdayClose",
      "wednesdayOpen",
      "city",
      "visible",
      "comingSoon",
      "yextId",
      "region",
    ]

    location.orderUrl = {
      url: location.orderUrl,
      preferDisplayUrl: false,
    }
    let obj = {
      address: {
        line1: location.line1,
        city: location.city,
        region: location.region,
        postalCode: location.postalCode,
      },
      meta: {
        id: location.c_locationName.replaceAll(" ", "-").toLowerCase(),
      },
      //   hours: hoursObject,

      c_oloID: location.c_oloID.toString() || "",
      ...location,
    }
    deleteKeys.forEach((key) => {
      delete obj[key]
    })
    const result = await axios.post(url, obj)

    toast({
      duration: null,
      position: "top-right",
      title: `${result.data.message || "Success"}`,
      status: result.data.type == "FATAL_ERROR" ? "error" : "success",
      isClosable: true,
    })
    console.log(result)

    if (result.data.redirect) {
      setTimeout(() => {
        router.push(result.data.redirect)
      }, 3000)
    }
    // router.reload()
  }
  return (
    <Box bgColor="white">
      <Box bgColor={"white"} p={5}>
        <Flex justifyContent={"space-between"}>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">All Locations</BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink href="/admin/add">Add Location</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Flex>
      </Box>
      <main className={styles.main}>
        <Formik
          initialValues={{
            c_locationName,
            c_locationShortName,
            line1: address.line1 || "",
            city: address.city || "",
            region: address.region || "",
            postalCode: address.postalCode || "",
            description,
            name,
            c_cateringURL,
            c_infoBanner,
            c_locationName,
            c_locationShortName,
            c_locationSlug,
            c_mapTile,
            c_mapUrl,
            c_oloID: c_oloID.toString(),
            c_promoUrl,
            c_shortDescription,
            geocodedCoordinate,
            mainPhone,
            orderUrl: orderUrl.url,
            visible,
            c_comingSoonText,
            c_locationHighlights,
            mondayOpen: hours.monday.openIntervals ? hours.monday.openIntervals[0].start : "",
            mondayClose: hours.monday.openIntervals ? hours.monday.openIntervals[0].end : "",
            tuesdayOpen: hours.tuesday.openIntervals ? hours.tuesday.openIntervals[0].start : "",
            tuesdayClose: hours.tuesday.openIntervals ? hours.tuesday.openIntervals[0].end : "",
            wednesdayOpen: hours.wednesday.openIntervals ? hours.wednesday.openIntervals[0].start : "",
            wednesdayClose: hours.wednesday.openIntervals ? hours.wednesday.openIntervals[0].end : "",
            thursdayOpen: hours.thursday.openIntervals ? hours.thursday.openIntervals[0].start : "",
            thursdayClose: hours.thursday.openIntervals ? hours.thursday.openIntervals[0].end : "",
            fridayOpen: hours.friday.openIntervals ? hours.friday.openIntervals[0].start : "",
            fridayClose: hours.friday.openIntervals ? hours.friday.openIntervals[0].end : "",
            saturdayOpen: hours.saturday.openIntervals ? hours.saturday.openIntervals[0].start : "",
            saturdayClose: hours.saturday.openIntervals ? hours.saturday.openIntervals[0].end : "",
            sundayOpen: hours.sunday.openIntervals ? hours.sunday.openIntervals[0].start : "",
            sundayClose: hours.sunday.openIntervals ? hours.sunday.openIntervals[0].end : "",
          }}
          onSubmit={async (values) => {
            await addLocation(values)
          }}>
          <Form>
            <Box>
              <h1>basic info</h1>
              <Flex justifyContent={"space-between"}>
                <span>
                  <label htmlFor="c_locationName">Name</label>
                  <Input as={Field} id="c_locationName" name="c_locationName" placeholder="Hoots Wings" isRequired />
                </span>

                <span>
                  <label htmlFor="c_locationShortName">Abbreviated name</label>
                  <Input as={Field} id="c_locationShortName" name="c_locationShortName" placeholder="Hoots" />
                </span>
              </Flex>
            </Box>

            <div className="formGroup">
              <span>
                <label htmlFor="c_comingSoonText">Coming Soon Text</label>
                <Input as={Field} id="c_comingSoonText" name="c_comingSoonText" placeholder="Opening in April" />
                <label htmlFor="c_shortDescription">Tagline</label>
                <Input as={Field} id="c_shortDescription" name="c_shortDescription" placeholder="tagline" />
              </span>
            </div>

            <div className="formGroup">
              <Flex flexWrap={"wrap"} justifyContent="space-between">
                <span>
                  <label htmlFor="line1">Street</label>
                  <Input as={Field} id="line1" name="line1" placeholder="Street Address" required />
                </span>
                <span>
                  <label htmlFor="city">City</label>
                  <Input as={Field} id="city" name="city" placeholder="City" required />
                </span>
                <span>
                  <label htmlFor="postalCode">Zip</label>
                  <Input as={Field} id="postalCode" type="number" name="postalCode" placeholder="00000" required />
                </span>

                <span>
                  <label htmlFor="region">state</label>
                  <Input as={Field} id="region" name="region" placeholder="state" required />
                </span>

                <span>
                  <label htmlFor="mainPhone">Phone</label>
                  <Input as={Field} id="mainPhone" type="text" name="mainPhone" placeholder="000-000-0000" />
                </span>
                <span>
                  <label htmlFor="c_oloID">OLO ID</label>
                  <Input as={Field} id="c_oloID" name="c_oloID" type="text" placeholder="" />
                </span>
              </Flex>
            </div>

            <h1>Links</h1>
            <div className="formGroup">
              <span>
                <label htmlFor="orderUrl">Order URL</label>
                <Input as={Field} id="orderUrl" name="orderUrl" placeholder="" />

                <label htmlFor="c_cateringURL">Catering URL</label>
                <Input as={Field} id="c_cateringURL" name="c_cateringURL" placeholder="" />
              </span>
            </div>

            <div className="formGroup">
              <label htmlFor="c_mapUrl">Google Maps URL</label>
              <Input as={Field} id="c_mapUrl" name="c_mapUrl" placeholder="tagline" />
            </div>

            <div className="formGroup storeHours">
              <h1>store hours</h1>
              <HoursInput hours={EmptyLocationObject.hours} />
            </div>

            <div className="formGroup">
              <p>Description</p>
              <Field id="description" name="description" placeholder="description" as="textarea" />

              <div role="group" aria-labelledby="checkbox-group">
                <label>
                  <Field type="checkbox" name="c_locationHighlights" value="BEER_AND_WINE" />
                  Beer & Wine
                </label>
                <label>
                  <Field type="checkbox" name="c_locationHighlights" value="DELIVERY" />
                  Delivery
                </label>
                <label>
                  <Field type="checkbox" name="c_locationHighlights" value="CARRYOUT" />
                  Carryout
                </label>

                <label>
                  <Field type="checkbox" name="c_locationHighlights" value="PATIO_SEATING" />
                  Patio Seating
                </label>

                <label>
                  <Field type="checkbox" name="c_locationHighlights" value="PET_FRIENDLY" />
                  Pet Friendly
                </label>
              </div>
            </div>
            <Button type="submit">Submit</Button>
          </Form>
        </Formik>
      </main>

      <footer className={styles.footer}></footer>
    </Box>
  )
}
export default withUrqlClient(createUrqlClient, { ssr: false })(Location)
